/**
 * Static Site Builder
 * Generates static HTML files from EJS templates
 * Run: npm run build:html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'src/templates');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DATA_DIR = path.join(ROOT_DIR, 'data');

// Load config (Windows-compatible)
const configPath = path.join(ROOT_DIR, 'config/site.config.js');
const configUrl = pathToFileURL(configPath).href;
const config = (await import(configUrl)).default;

/**
 * Add tracking parameters to MDH URLs
 */
function addTrackingParams(url) {
  if (!url || !config.feed.trackingParams) return url;
  const separator = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams(config.feed.trackingParams).toString();
  return `${url}${separator}${params}`;
}

/**
 * Get profile URL with tracking
 */
function getProfileUrl() {
  return addTrackingParams(config.model.profileUrl);
}

/**
 * Generate SEO title from template
 */
function generateSeoTitle(template, data = {}) {
  if (!template) return data.fallback || '';
  return template
    .replace(/%name%/g, config.model.name)
    .replace(/%title%/g, data.title || '')
    .replace(/%count%/g, data.count || '');
}

/**
 * Generate SEO description from template
 */
function generateSeoDescription(template, data = {}) {
  if (!template) return data.fallback || '';
  return template
    .replace(/%name%/g, config.model.name)
    .replace(/%title%/g, data.title || '')
    .replace(/%count%/g, data.count || '');
}

/**
 * Load video data
 */
function loadVideoData() {
  const cacheFile = path.join(ROOT_DIR, config.feed.cacheFile);

  if (fs.existsSync(cacheFile)) {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return data;
  }

  console.warn('⚠️  No video cache found. Run "npm run fetch-feed" first.');
  return { videos: [], totalVideos: 0, lastUpdated: null };
}

/**
 * Load profile data
 */
function loadProfileData() {
  const profileFile = path.join(ROOT_DIR, 'data/profile.json');

  if (fs.existsSync(profileFile)) {
    const data = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
    return data.profile || null;
  }

  return null;
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Render template
 */
async function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATE_DIR, `${templateName}.ejs`);
  const template = fs.readFileSync(templatePath, 'utf8');

  return ejs.render(template, data, {
    filename: templatePath,
    views: [TEMPLATE_DIR, path.join(TEMPLATE_DIR, 'partials')]
  });
}

/**
 * Copy static assets
 */
function copyAssets() {
  const assetsDir = path.join(ROOT_DIR, 'src/assets');
  const distAssetsDir = path.join(DIST_DIR);

  // Copy images
  const imagesSource = path.join(assetsDir, 'images');
  const imagesDest = path.join(distAssetsDir, 'images');
  if (fs.existsSync(imagesSource)) {
    ensureDir(imagesDest);
    copyDir(imagesSource, imagesDest);
  }

  // Copy fonts
  const fontsSource = path.join(assetsDir, 'fonts');
  const fontsDest = path.join(distAssetsDir, 'fonts');
  if (fs.existsSync(fontsSource)) {
    ensureDir(fontsDest);
    copyDir(fontsSource, fontsDest);
  }

  // Copy videos (for fake video player)
  const videosSource = path.join(assetsDir, 'videos');
  const videosDest = path.join(distAssetsDir, 'videos');
  if (fs.existsSync(videosSource)) {
    ensureDir(videosDest);
    copyDir(videosSource, videosDest);
  }

  console.log('📁 Assets copied');
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      ensureDir(destPath);
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Generate Schema.org JSON-LD
 */
function generateSchema(type, data) {
  const baseSchema = {
    "@context": "https://schema.org",
  };

  // Get all social URLs
  const socialUrls = Object.values(config.model.social).filter(Boolean);

  switch (type) {
    case 'profilePage':
      const profile = data?.profile;
      const avatarUrl = data?.avatarUrl || `${config.site.url}${config.model.avatar}`;
      const now = new Date().toISOString();

      return {
        ...baseSchema,
        "@type": "ProfilePage",
        "@id": `${config.site.url}/#profilepage`,
        "url": config.site.url,
        "name": `Profil von ${config.model.name}`,
        "description": config.seo.description,
        "dateCreated": "2025-01-01T00:00:00.000Z",
        "dateModified": now,
        "mainEntity": {
          "@type": "Person",
          "@id": `${config.site.url}/#person`,
          "name": config.model.name,
          "alternateName": [config.model.username, config.model.name.toLowerCase(), config.model.username.toLowerCase()],
          "identifier": config.model.id,
          "url": config.site.url,
          "image": {
            "@type": "ImageObject",
            "url": avatarUrl,
            "width": 400,
            "height": 400,
            "caption": `Profilbild von ${config.model.name}`
          },
          "description": config.model.bio,
          "jobTitle": "Content Creator",
          "knowsLanguage": {
            "@type": "Language",
            "name": "Deutsch",
            "alternateName": "de"
          },
          "nationality": {
            "@type": "Country",
            "name": "Deutschland",
            "alternateName": "DE"
          },
          "sameAs": socialUrls,
          "memberOf": {
            "@type": "Organization",
            "name": "MyDirtyHobby",
            "url": "https://www.mydirtyhobby.de",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.mydirtyhobby.com/favicon.ico"
            }
          },
          "brand": {
            "@type": "Brand",
            "name": config.model.name,
            "url": config.site.url,
            "logo": {
              "@type": "ImageObject",
              "url": avatarUrl,
              "width": 400,
              "height": 400,
              "caption": `Profilbild von ${config.model.name}`
            }
          },
          ...(profile ? {
            "gender": profile.gender || "weiblich",
            "height": profile.height ? {
              "@type": "QuantitativeValue",
              "value": profile.height,
              "unitCode": "CMT",
              "unitText": "cm"
            } : undefined
          } : {})
        }
      };

    case 'website':
      return {
        ...baseSchema,
        "@type": "WebSite",
        "name": config.site.name,
        "url": config.site.url,
        "description": config.seo.description,
        "inLanguage": config.site.language,
        "publisher": {
          "@type": "Person",
          "name": config.model.name,
          "url": config.site.url
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${config.site.url}/videos.html?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };

    case 'video':
      return {
        ...baseSchema,
        "@type": "VideoObject",
        "name": data.title,
        "description": data.description || `${data.title} - Video von ${config.model.name}`,
        "thumbnailUrl": data.thumbnail,
        "uploadDate": data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        "duration": `PT${Math.floor(data.duration / 60)}M${data.duration % 60}S`,
        "contentUrl": data.url,
        "embedUrl": data.url,
        "author": {
          "@type": "Person",
          "name": config.model.name,
          "url": config.site.url
        },
        "publisher": {
          "@type": "Organization",
          "name": "MyDirtyHobby",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.mydirtyhobby.com/favicon.ico"
          }
        },
        "inLanguage": config.site.language,
        "isFamilyFriendly": false,
        "genre": data.tags?.join(', ') || "Amateur"
      };

    case 'videoList':
      return {
        ...baseSchema,
        "@type": "ItemList",
        "name": `Videos von ${config.model.name}`,
        "description": `Alle ${data.totalVideos} Videos von ${config.model.name}`,
        "numberOfItems": data.totalVideos,
        "itemListElement": data.videos.slice(0, 10).map((video, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `${config.site.url}/videos/${video.slug}/`,
          "name": video.title
        }))
      };

    case 'breadcrumb':
      return {
        ...baseSchema,
        "@type": "BreadcrumbList",
        "itemListElement": data.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      };

    case 'faq':
      return {
        ...baseSchema,
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `Wo kann ich Videos von ${config.model.name} sehen?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Alle exklusiven Videos von ${config.model.name} findest du auf MyDirtyHobby. Diese Seite bietet dir eine Vorschau und verlinkt direkt zu den vollständigen Videos auf der Plattform.`
            }
          },
          {
            "@type": "Question",
            "name": `Wie viele Videos hat ${config.model.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Aktuell hat ${config.model.name} ${data?.totalVideos || 'viele'} Videos auf MyDirtyHobby veröffentlicht. Neue Inhalte werden regelmäßig hinzugefügt.`
            }
          },
          {
            "@type": "Question",
            "name": `Ist ${config.model.name} eine echte Amateur-Darstellerin?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Ja, ${config.model.name} ist eine authentische Amateur-Darstellerin aus Deutschland, die ihre eigenen Inhalte produziert und auf MyDirtyHobby teilt.`
            }
          }
        ]
      };


    default:
      return baseSchema;
  }
}

/**
 * Build all pages
 */
async function build() {
  console.log(`\n🏗️  Building ${config.site.name}...\n`);

  // Ensure dist directory
  ensureDir(DIST_DIR);
  ensureDir(path.join(DIST_DIR, 'videos'));
  ensureDir(path.join(DIST_DIR, 'css'));

  // Load video data
  const videoData = loadVideoData();

  // Load profile data
  const profile = loadProfileData();
  if (profile) {
    console.log(`👤 Profile loaded: ${profile.name}, ${profile.age} Jahre`);
  }

  // Common template data
  const commonData = {
    config,
    currentYear: new Date().getFullYear(),
    generateSchema,
    basePath: '', // Root level pages
    profileUrl: getProfileUrl(), // Profile URL with tracking
    addTrackingParams, // Helper function for templates
    profile // Profile data from API
  };

  // Build index page
  console.log('📄 Building index.html...');
  const homeTitle = config.seoTemplates?.homeTitle
    ? generateSeoTitle(config.seoTemplates.homeTitle)
    : config.site.name;
  const homeDescription = config.seoTemplates?.homeDescription
    ? generateSeoDescription(config.seoTemplates.homeDescription)
    : config.seo.description;
  const indexHtml = await renderTemplate('index', {
    ...commonData,
    videos: videoData.videos.slice(0, config.videoSettings.videosPerPage),
    totalVideos: videoData.totalVideos,
    pageTitle: homeTitle,
    pageDescription: homeDescription,
    canonicalUrl: `${config.site.url}/`
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

  // Build videos page (all videos) as /videos/index.html
  console.log('📄 Building videos/index.html...');
  const videosDir = path.join(DIST_DIR, 'videos');
  ensureDir(videosDir);
  const videosTitle = config.seoTemplates?.videosTitle
    ? generateSeoTitle(config.seoTemplates.videosTitle, { count: videoData.totalVideos })
    : `Videos - ${config.site.name}`;
  const videosDescription = config.seoTemplates?.videosDescription
    ? generateSeoDescription(config.seoTemplates.videosDescription, { count: videoData.totalVideos })
    : `Alle Videos von ${config.model.name}. ${videoData.totalVideos} exklusive Amateur-Videos.`;
  const videosHtml = await renderTemplate('videos', {
    ...commonData,
    basePath: '../', // Videos page is in /videos/ subfolder
    videos: videoData.videos,
    totalVideos: videoData.totalVideos,
    pageTitle: videosTitle,
    pageDescription: videosDescription,
    canonicalUrl: `${config.site.url}/videos/`
  });
  fs.writeFileSync(path.join(videosDir, 'index.html'), videosHtml);

  // Build individual video pages
  console.log(`📄 Building ${videoData.videos.length} video pages...`);
  for (const video of videoData.videos) {
    // Create folder for each video: /videos/slug/index.html
    const videoDir = path.join(DIST_DIR, 'videos', video.slug);
    ensureDir(videoDir);

    const videoTitle = config.seoTemplates?.videoTitle
      ? generateSeoTitle(config.seoTemplates.videoTitle, { title: video.title })
      : `${video.title} - ${config.model.name}`;
    const videoDescription = config.seoTemplates?.videoDescription
      ? generateSeoDescription(config.seoTemplates.videoDescription, { title: video.title })
      : (video.description || `${video.title} - Exklusives Video von ${config.model.name}`);
    const videoHtml = await renderTemplate('video-detail', {
      ...commonData,
      basePath: '../../', // Video pages are in /videos/slug/ subfolder
      video,
      relatedVideos: getRelatedVideos(video, videoData.videos),
      pageTitle: videoTitle,
      pageDescription: videoDescription,
      canonicalUrl: `${config.site.url}/videos/${video.slug}/`
    });
    fs.writeFileSync(path.join(videoDir, 'index.html'), videoHtml);
  }

  // Legal pages disabled - running under the radar
  // const legalPages = {
  //   'impressum': 'Impressum',
  //   'datenschutz': 'Datenschutzerklärung',
  //   'agb': 'Allgemeine Geschäftsbedingungen'
  // };

  // Build 404 error page
  console.log('📄 Building 404.html...');
  const notFoundHtml = await renderTemplate('404', {
    ...commonData,
    pageTitle: `Seite nicht gefunden - ${config.model.name}`,
    pageDescription: 'Die gesuchte Seite wurde nicht gefunden.',
    canonicalUrl: `${config.site.url}/404`
  });
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml);

  // Copy assets
  copyAssets();

  // Generate sitemap
  generateSitemap(videoData.videos);

  // Generate robots.txt
  generateRobots();

  // Generate .htaccess
  generateHtaccess();

  console.log(`\n✅ Build complete! Output: ${DIST_DIR}\n`);
}

/**
 * Get related videos
 */
function getRelatedVideos(currentVideo, allVideos, limit = 6) {
  return allVideos
    .filter(v => v.id !== currentVideo.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date to W3C datetime format (without milliseconds)
 */
function formatW3CDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

/**
 * Generate sitemap files (sitemap_index.xml, page-sitemap.xml, video-sitemap.xml)
 */
function generateSitemap(videos) {
  const now = formatW3CDate(new Date());

  // Get latest video date for video sitemap lastmod
  const latestVideoDate = videos.length > 0
    ? formatW3CDate(videos.reduce((latest, v) => {
        const vDate = v.date ? new Date(v.date) : new Date(0);
        return vDate > latest ? vDate : latest;
      }, new Date(0)))
    : now;

  // 1. Generate sitemap_index.xml
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${config.site.url}/page-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${config.site.url}/video-sitemap.xml</loc>
    <lastmod>${latestVideoDate}</lastmod>
  </sitemap>
</sitemapindex>`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap_index.xml'), sitemapIndex);

  // 2. Generate page-sitemap.xml (main pages only) with changefreq and priority
  const pageSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.site.url}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${config.site.url}/videos/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, 'page-sitemap.xml'), pageSitemap);

  // 3. Generate video-sitemap.xml with video schema
  const videoUrls = videos.map(v => {
    const publicationDate = v.date ? formatW3CDate(new Date(v.date)) : now;
    const description = v.description || `${v.title} - Video von ${config.model.name}`;
    const duration = v.duration || 0;

    // Generate video tags from categories/tags
    const tags = (v.tags || v.categories || [])
      .map(tag => `      <video:tag>${escapeXml(tag)}</video:tag>`)
      .join('\n');

    return `  <url>
    <loc>${config.site.url}/videos/${v.slug}/</loc>
    <lastmod>${publicationDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <video:video>
      <video:thumbnail_loc>${escapeXml(v.thumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(v.title)}</video:title>
      <video:description>${escapeXml(description)}</video:description>
      <video:duration>${duration}</video:duration>
      <video:publication_date>${publicationDate}</video:publication_date>
      <video:family_friendly>no</video:family_friendly>
      <video:requires_subscription>yes</video:requires_subscription>
      <video:uploader info="${config.site.url}">${escapeXml(config.model.name)}</video:uploader>
${tags}
    </video:video>
  </url>`;
  }).join('\n');

  const videoSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videoUrls}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, 'video-sitemap.xml'), videoSitemap);

  console.log('🗺️  Sitemaps generated (sitemap_index.xml, page-sitemap.xml, video-sitemap.xml)');
}

/**
 * Generate robots.txt
 */
function generateRobots() {
  const robots = `User-agent: *
Allow: /

Sitemap: ${config.site.url}/sitemap_index.xml
`;

  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robots);
  console.log('🤖 robots.txt generated');
}

/**
 * Generate .htaccess for Apache
 */
function generateHtaccess() {
  const htaccess = `# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Force non-WWW
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [L,R=301]

# Redirect sitemap.xml to sitemap_index.xml
RewriteRule ^sitemap\\.xml$ /sitemap_index.xml [R=301,L]

# Remove trailing slash (except for directories)
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} (.+)/$
RewriteRule ^ %1 [R=301,L]

# Custom 404 Error Page
ErrorDocument 404 /404.html

# Prevent directory listing
Options -Indexes

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
`;

  fs.writeFileSync(path.join(DIST_DIR, '.htaccess'), htaccess);
  console.log('⚙️  .htaccess generated');
}

// Run build
build().catch(console.error);
