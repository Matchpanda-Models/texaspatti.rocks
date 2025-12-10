/**
 * Feed Fetcher Script
 * Fetches videos and profile data from the API and caches them locally
 * Run: npm run fetch-feed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config (Windows-compatible)
const configPath = path.join(__dirname, '../config/site.config.js');
const configUrl = pathToFileURL(configPath).href;
const config = (await import(configUrl)).default;

const DATA_DIR = path.join(__dirname, '../data');
const CACHE_FILE = path.join(__dirname, '..', config.feed.cacheFile);
const PROFILE_CACHE_FILE = path.join(DATA_DIR, 'profile.json');
const IMAGES_DIR = path.join(__dirname, '../src/assets/images/videos');

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch videos from API with pagination
 */
async function fetchVideos() {
  console.log('📡 Fetching videos from API...');

  const allVideos = [];
  let offset = 0;
  const limit = 200; // Videos per page
  let hasMore = true;
  let pageNum = 1;

  try {
    while (hasMore) {
      // Build URL with current offset
      const baseUrl = config.feed.url.replace(/offset=\d+/, `offset=${offset}`);
      const url = baseUrl.includes('offset=') ? baseUrl : `${baseUrl}&offset=${offset}`;

      process.stdout.write(`   📄 Page ${pageNum} (offset ${offset})...`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'de-DE,de;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const videos = data.videos || data.items || data.data || [];

      if (videos.length === 0) {
        // No more videos
        hasMore = false;
        console.log(' keine weiteren Videos');
      } else {
        allVideos.push(...videos);
        console.log(` ${videos.length} Videos geladen (gesamt: ${allVideos.length})`);

        // Check if we got less than limit (last page)
        if (videos.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
          pageNum++;

          // Rate limiting: 1 second delay between requests
          await sleep(1000);
        }
      }
    }

    console.log(`   ✅ Insgesamt ${allVideos.length} Videos gefunden`);

    // Return in expected format
    return { videos: allVideos };
  } catch (error) {
    console.error('\n❌ Error fetching feed:', error.message);
    return null;
  }
}

/**
 * Transform API data to our format
 */
function transformVideos(apiData) {
  // Adjust this based on actual API response structure
  const videos = apiData.videos || apiData.items || apiData.data || [];

  return videos.map((video, index) => {
    // Parse runtime from "MM.SS" format to seconds
    const runtime = video.runtime || '0';
    let durationSeconds = 0;
    if (runtime.includes('.')) {
      const [mins, secs] = runtime.split('.');
      durationSeconds = parseInt(mins) * 60 + parseInt(secs);
    } else {
      durationSeconds = parseInt(runtime) || 0;
    }

    // Parse release date (handles Unix timestamps and various date formats)
    const rawDate = video.releasetime || video.date || video.createdAt || video.publishedAt;
    const releaseDate = parseReleaseDate(rawDate);

    // Extract category names from API structure
    const categories = (video.categories || []).map(cat => cat.name || cat);

    // Add atc tracking parameter to URL if not present
    let videoUrl = video.url || video.videoUrl || `${config.feed.videoBaseUrl}${video.id}`;
    if (config.feed.trackingParams?.atc && !videoUrl.includes('atc=')) {
      videoUrl += `&atc=${config.feed.trackingParams.atc}`;
    }

    const thumbnailUrl = video.image || video.thumbnail || video.thumbUrl || video.preview;

    return {
      id: video.id || video.videoId || `video-${index}`,
      slug: slugify(video.title || `video-${index}`),
      title: video.title || video.name || 'Untitled Video',
      description: video.description || video.text || '',
      thumbnail: thumbnailUrl, // Will be replaced with local path after download
      thumbnailOriginal: thumbnailUrl, // Keep original URL for downloading
      thumbnailWebp: video.thumbnailWebp || null,
      duration: durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      views: video.views || video.viewCount || 0,
      likes: video.likes || video.likeCount || video.rating_count || 0,
      date: releaseDate || new Date().toISOString(),
      dateFormatted: formatDate(releaseDate),
      tags: categories,
      url: videoUrl,
      isHD: video.isHD || video.hd || video.quality === 'HD',
      isNew: isNewVideo(releaseDate)
    };
  });
}

/**
 * Create URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds) {
  if (typeof seconds === 'string' && seconds.includes(':')) {
    return seconds;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to German locale
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Check if video is new (within last 7 days)
 */
function isNewVideo(dateStr) {
  if (!dateStr) return false;
  const videoDate = new Date(dateStr);
  const now = new Date();
  const diffDays = (now - videoDate) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/**
 * Parse release date from various formats to ISO string
 * Handles: Unix timestamps (seconds), ISO strings, date-only strings
 */
function parseReleaseDate(value) {
  if (!value) return null;

  // If it's a number or numeric string (Unix timestamp in seconds)
  if (typeof value === 'number' || /^\d+$/.test(value)) {
    const timestamp = parseInt(value, 10);
    // Unix timestamps in seconds are typically 10 digits (before year 2286)
    // Millisecond timestamps are 13 digits
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    return new Date(ms).toISOString();
  }

  // If it's already a valid date string
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}

/**
 * Download image and save locally with SEO-friendly name
 */
async function downloadImage(imageUrl, slug) {
  if (!imageUrl) return null;

  // Ensure images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  // Create SEO-friendly filename: model-name-video-slug.jpg
  const modelSlug = slugify(config.model.name);
  const extension = getImageExtension(imageUrl);
  const filename = `${modelSlug}-${slug}${extension}`;
  const localPath = path.join(IMAGES_DIR, filename);

  // Skip if already downloaded
  if (fs.existsSync(localPath)) {
    return `/images/videos/${filename}`;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.mydirtyhobby.com/'
      }
    });

    if (!response.ok) {
      console.warn(`   ⚠️  Could not download: ${slug}`);
      return imageUrl; // Fall back to original URL
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));

    return `/images/videos/${filename}`;
  } catch (error) {
    console.warn(`   ⚠️  Error downloading ${slug}: ${error.message}`);
    return imageUrl; // Fall back to original URL
  }
}

/**
 * Get image extension from URL
 */
function getImageExtension(url) {
  if (!url) return '.jpg';
  const urlPath = url.split('?')[0];
  const ext = path.extname(urlPath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
}

/**
 * Download all video thumbnails (parallel downloads for speed)
 */
async function downloadThumbnails(videos) {
  console.log(`🖼️  Downloading ${videos.length} thumbnails...`);

  const modelSlug = slugify(config.model.name);
  const PARALLEL_DOWNLOADS = 10; // Number of concurrent downloads

  let downloaded = 0;
  let skipped = 0;
  let cached = 0;

  // Process videos in batches
  for (let i = 0; i < videos.length; i += PARALLEL_DOWNLOADS) {
    const batch = videos.slice(i, i + PARALLEL_DOWNLOADS);

    const promises = batch.map(async (video) => {
      const extension = getImageExtension(video.thumbnailOriginal);
      const filename = `${modelSlug}-${video.slug}${extension}`;
      const localFilePath = path.join(IMAGES_DIR, filename);

      if (fs.existsSync(localFilePath)) {
        video.thumbnail = `/images/videos/${filename}`;
        return 'cached';
      } else {
        const result = await downloadImage(video.thumbnailOriginal, video.slug);
        if (result && result.startsWith('/images/')) {
          video.thumbnail = result;
          return 'downloaded';
        } else {
          return 'skipped';
        }
      }
    });

    const results = await Promise.all(promises);

    // Count results
    results.forEach(r => {
      if (r === 'downloaded') downloaded++;
      else if (r === 'cached') cached++;
      else skipped++;
    });

    // Progress indicator
    const total = downloaded + skipped + cached;
    process.stdout.write(`   ${total}/${videos.length} processed\r`);

    // Small delay between batches to avoid rate limiting
    if (i + PARALLEL_DOWNLOADS < videos.length) {
      await sleep(100);
    }
  }

  console.log(`\n   ✅ Downloaded: ${downloaded}, Cached: ${cached}, Skipped: ${skipped}`);
  return videos;
}

/**
 * Download profile avatar locally
 */
async function downloadAvatar(avatarUrl) {
  if (!avatarUrl) return null;

  const AVATAR_DIR = path.join(__dirname, '../src/assets/images');
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }

  // SEO-friendly filename: model-name-avatar.jpg
  const modelSlug = slugify(config.model.name);
  const extension = getImageExtension(avatarUrl);
  const filename = `${modelSlug}-avatar${extension}`;
  const localPath = path.join(AVATAR_DIR, filename);

  // Skip if already downloaded
  if (fs.existsSync(localPath)) {
    console.log(`   📁 Avatar already cached: ${filename}`);
    return `/images/${filename}`;
  }

  console.log(`🖼️  Downloading avatar...`);

  try {
    const response = await fetch(avatarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.mydirtyhobby.com/'
      }
    });

    if (!response.ok) {
      console.warn(`   ⚠️  Could not download avatar`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));
    console.log(`   ✅ Avatar saved: ${filename}`);

    return `/images/${filename}`;
  } catch (error) {
    console.warn(`   ⚠️  Error downloading avatar: ${error.message}`);
    return null;
  }
}

/**
 * Fetch profile data from API
 */
async function fetchProfile() {
  const profileUrl = config.feed.profileUrl || config.feed.url.replace('/amateurvideos/', '/amateurs/');
  console.log('👤 Fetching profile data...');

  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'de-DE,de;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message);
    return null;
  }
}

/**
 * Transform profile data
 */
function transformProfile(apiData) {
  if (!apiData) return null;

  return {
    id: apiData.u_id,
    username: apiData.nick,
    name: apiData.vorname || apiData.nick,
    gender: apiData.gender,
    age: apiData.u_alter,

    // Location
    country: apiData.land?.toUpperCase(),
    zipCode: apiData.plz,

    // Physical attributes
    height: apiData.groesse,
    weight: apiData.gewicht,
    eyeColor: apiData.augen,
    hairColor: apiData.haare,
    bustSize: apiData.k_umfang ? `${apiData.k_umfang}${apiData.k_schale}` : null,
    intimate: apiData.rasintim === 1 ? 'Rasiert' : null,

    // Appearance tags
    appearance: apiData.aussehen || [],
    hasTattoos: apiData.tatoos,
    piercings: apiData.piercing || null,

    // Personal info
    profession: apiData.beruf,
    relationshipStatus: apiData.famst,
    zodiac: apiData.sternzeichen,
    sexualOrientation: apiData.sexor,

    // Preferences
    preferences: apiData.sexvor || [],
    lookingFor: apiData.suche || [],
    interests: apiData.interesse || [],

    // Media
    avatar: apiData.images?.bild1 || null,

    // Bio
    bio: apiData.beschr || '',

    // URLs - add atc tracking if configured
    profileUrl: apiData.url ? (apiData.url + (config.feed.trackingParams?.atc && !apiData.url.includes('atc=') ? `&atc=${config.feed.trackingParams.atc}` : '')) : null
  };
}

/**
 * Save profile to cache
 */
function saveProfileCache(profile) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const cacheData = {
    lastUpdated: new Date().toISOString(),
    profile
  };

  fs.writeFileSync(PROFILE_CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  console.log(`✅ Profile saved to data/profile.json`);
}

/**
 * Save data to cache file
 */
function saveCache(data) {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const cacheData = {
    lastUpdated: new Date().toISOString(),
    modelId: config.model.id,
    modelName: config.model.name,
    totalVideos: data.length,
    videos: data
  };

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  console.log(`✅ Saved ${data.length} videos to ${config.feed.cacheFile}`);
}

/**
 * Load existing cache
 */
function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  }
  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n🎬 Feed Fetcher for ${config.model.name}\n`);

  // Check existing cache
  const existingCache = loadCache();
  if (existingCache) {
    console.log(`📁 Existing cache: ${existingCache.totalVideos} videos (${existingCache.lastUpdated})`);
  }

  // Fetch profile data
  const profileData = await fetchProfile();
  if (profileData) {
    const profile = transformProfile(profileData);

    // Download avatar locally (avoids CDN/adblocker issues)
    if (profile.avatar) {
      const localAvatar = await downloadAvatar(profile.avatar);
      if (localAvatar) {
        profile.avatarOriginal = profile.avatar; // Keep original URL
        profile.avatar = localAvatar; // Use local path
      }
    }

    saveProfileCache(profile);
    console.log(`   Name: ${profile.name}, ${profile.age} Jahre`);
    console.log(`   ${profile.height}cm, ${profile.hairColor}, ${profile.eyeColor} Augen`);

    // Rate limiting: 1 second delay before fetching videos
    await sleep(1000);
  }

  // Fetch video data
  const apiData = await fetchVideos();

  if (apiData) {
    let videos = transformVideos(apiData);

    // Download thumbnails locally (avoids adblocker issues)
    videos = await downloadThumbnails(videos);

    saveCache(videos);
    console.log(`\n✨ Feed update complete!`);
  } else {
    console.log('\n⚠️  Could not fetch video data.');

    if (existingCache) {
      console.log('📁 Using existing cache.');
    } else {
      console.log('📝 Creating sample data for development...');
      createSampleData();
    }
  }
}

/**
 * Create sample data for development
 */
function createSampleData() {
  const sampleVideos = [];
  const modelSlug = slugify(config.model.name);

  for (let i = 1; i <= 24; i++) {
    const slug = `beispiel-video-${i}`;
    sampleVideos.push({
      id: `sample-${i}`,
      slug: slug,
      title: `Beispiel Video ${i} - Exklusiver Content`,
      description: `Dies ist eine Beispielbeschreibung für Video ${i}. Hier würde der echte Beschreibungstext aus dem Feed stehen.`,
      thumbnail: `/images/videos/${modelSlug}-${slug}.jpg`,
      thumbnailOriginal: `https://via.placeholder.com/640x360/e11d48/ffffff?text=Video+${i}`,
      thumbnailWebp: null,
      duration: 300 + Math.floor(Math.random() * 600),
      durationFormatted: formatDuration(300 + Math.floor(Math.random() * 600)),
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateFormatted: formatDate(new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)),
      tags: ['Amateur', 'Deutsch', 'Exklusiv'],
      url: config.model.profileUrl,
      isHD: Math.random() > 0.3,
      isNew: i <= 3
    });
  }

  saveCache(sampleVideos);
  console.log('📝 Sample data created for development.');
}

// Run
main().catch(console.error);
