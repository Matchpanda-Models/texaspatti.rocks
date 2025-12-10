/**
 * New Model Page Creator
 * Creates a new model page configuration based on user input
 *
 * Run: npm run new-model
 * Usage: node scripts/create-model.js <modelName> <modelId> <domain>
 *
 * Example: node scripts/create-model.js "Lisa Mueller" 12345678 lisa-mueller.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Color helpers for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

/**
 * Create readline interface for interactive input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 */
function prompt(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultStr = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${colors.cyan}?${colors.reset} ${question}${defaultStr}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Generate slug from name
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
    .replace(/\-\-+/g, '-');
}

/**
 * Generate config file content
 */
function generateConfig(data) {
  return `/**
 * Site Configuration for ${data.name}
 * Generated on ${new Date().toISOString()}
 */

export default {
  // Basic Site Info
  site: {
    name: "${data.name}",
    domain: "${data.domain}",
    url: "https://${data.domain}",
    language: "de",
    locale: "de_DE"
  },

  // Model Information
  model: {
    id: "${data.id}",
    name: "${data.name}",
    username: "${data.username}",
    tagline: "${data.tagline}",

    // Profile URLs
    profileUrl: "https://www.mydirtyhobby.de/profil/${data.id}-${data.username}",

    // Images (place in /src/assets/images/)
    avatar: "/images/avatar.jpg",
    headerImage: "/images/header.jpg",

    // About Section
    bio: \`${data.bio}\`,

    // Profile Details
    details: {
      age: ${data.age || 'null'},
      location: ${data.location ? `"${data.location}"` : 'null'},
      bodyType: null,
      hairColor: null,
      eyeColor: null,
      height: null
    },

    // Social Links
    social: {
      instagram: null,
      twitter: null,
      tiktok: null,
      onlyfans: null
    }
  },

  // Video Feed Configuration
  feed: {
    url: "${data.feedUrl}",
    cacheFile: "data/videos.json",
    refreshInterval: 6,
    videoBaseUrl: "https://www.mydirtyhobby.de/video/"
  },

  // Theme Configuration
  theme: {
    primaryColor: "${data.primaryColor}",
    primaryHover: "${data.primaryHover}",
    secondaryColor: "#1f2937",
    accentColor: "#fbbf24",

    bgPrimary: "#0f0f0f",
    bgSecondary: "#1a1a1a",
    bgCard: "#262626",

    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",

    gradientFrom: "${data.primaryColor}",
    gradientTo: "${data.gradientTo}",

    borderRadius: "0.75rem"
  },

  // SEO Configuration
  seo: {
    description: "${data.seoDescription}",

    keywords: [
      "${data.name}",
      "Amateur Videos",
      "Exclusive Content",
      "German Amateur",
      "MyDirtyHobby"
    ],

    ogImage: "/images/og-image.jpg",
    ogType: "website",
    twitterCard: "summary_large_image",
    schemaType: "Person",
    isAdultContent: true
  },

  // Video Display Settings
  videoSettings: {
    videosPerPage: 12,
    aspectRatio: "16/9",
    showDuration: true,
    showViews: true,
    ctaButtonText: "Video ansehen",
    ctaButtonIcon: "play"
  },

  // Legal
  legal: {
    ageVerification: true,
    minimumAge: 18,
    privacyPolicyUrl: "/datenschutz",
    imprintUrl: "/impressum",
    termsUrl: "/agb"
  },

  // Analytics
  analytics: {
    googleAnalyticsId: null
  }
};
`;
}

/**
 * Generate SEO bio using basic template
 * In production, this could call an AI API
 */
function generateSeoBio(name, tagline) {
  return `Willkommen auf der offiziellen Seite von ${name}! ${tagline ? tagline + '. ' : ''}Hier findest du exklusive Amateur-Videos und Einblicke in meine Welt. Authentisch, leidenschaftlich und immer für eine Überraschung gut. Entdecke jetzt meine neuesten Videos und lerne mich besser kennen!`;
}

/**
 * Generate SEO description
 */
function generateSeoDescription(name) {
  return `Entdecke exklusive Amateur-Videos von ${name}. Authentische Inhalte, regelmäßige Updates und einzigartige Einblicke. Jetzt ansehen!`;
}

/**
 * Color theme presets
 */
const colorPresets = {
  rose: { primary: '#e11d48', hover: '#be123c', gradient: '#f43f5e' },
  purple: { primary: '#9333ea', hover: '#7e22ce', gradient: '#a855f7' },
  blue: { primary: '#2563eb', hover: '#1d4ed8', gradient: '#3b82f6' },
  pink: { primary: '#ec4899', hover: '#db2777', gradient: '#f472b6' },
  orange: { primary: '#ea580c', hover: '#c2410c', gradient: '#f97316' },
  teal: { primary: '#14b8a6', hover: '#0d9488', gradient: '#2dd4bf' }
};

/**
 * Main interactive setup
 */
async function interactiveSetup() {
  const rl = createInterface();

  log.title('🎬 Model Page Generator');
  console.log('This wizard will help you create a new model page configuration.\n');

  try {
    // Basic Information
    log.info('Basic Information');
    const name = await prompt(rl, 'Model name (display name)', 'New Model');
    const username = await prompt(rl, 'Username (for URLs)', slugify(name).replace(/-/g, '_'));
    const id = await prompt(rl, 'Model ID (from MDH)', '');
    const domain = await prompt(rl, 'Domain', `${slugify(name)}.com`);

    // Profile
    console.log('');
    log.info('Profile Details');
    const tagline = await prompt(rl, 'Tagline', 'Dein Girl von nebenan');
    const location = await prompt(rl, 'Location (optional)', 'Deutschland');
    const age = await prompt(rl, 'Age (optional, leave empty to hide)', '');

    // Feed
    console.log('');
    log.info('Video Feed');
    const feedUrl = await prompt(rl, 'Feed URL', `https://www.mydirtyhobby.com/api/amateurvideos/?amateurId=${id}&limit=200&offset=0&language=de`);

    // Theme
    console.log('');
    log.info('Theme (choose a color preset)');
    console.log('  Available: rose, purple, blue, pink, orange, teal');
    const colorChoice = await prompt(rl, 'Color theme', 'rose');
    const colors = colorPresets[colorChoice] || colorPresets.rose;

    rl.close();

    // Generate content
    const bio = generateSeoBio(name, tagline);
    const seoDescription = generateSeoDescription(name);

    const configData = {
      name,
      username,
      id,
      domain,
      tagline,
      location,
      age: age || null,
      feedUrl,
      bio,
      seoDescription,
      primaryColor: colors.primary,
      primaryHover: colors.hover,
      gradientTo: colors.gradient
    };

    // Generate config file
    const configContent = generateConfig(configData);
    const configPath = path.join(ROOT_DIR, 'config', 'site.config.js');

    // Backup existing config
    if (fs.existsSync(configPath)) {
      const backupPath = path.join(ROOT_DIR, 'config', `site.config.backup.${Date.now()}.js`);
      fs.copyFileSync(configPath, backupPath);
      log.warn(`Existing config backed up to: ${path.basename(backupPath)}`);
    }

    // Write new config
    fs.writeFileSync(configPath, configContent, 'utf8');
    log.success(`Configuration saved to: config/site.config.js`);

    // Create assets directories
    const assetsDir = path.join(ROOT_DIR, 'src', 'assets', 'images');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
      log.success('Created assets directory: src/assets/images/');
    }

    // Summary
    log.title('✨ Setup Complete!');
    console.log('Next steps:');
    console.log(`  1. Add avatar.jpg to src/assets/images/`);
    console.log(`  2. Add og-image.jpg (1200x630) to src/assets/images/`);
    console.log(`  3. Run: npm install`);
    console.log(`  4. Run: npm run fetch-feed`);
    console.log(`  5. Run: npm run build`);
    console.log(`  6. Deploy the dist/ folder to your server`);
    console.log('');

  } catch (error) {
    rl.close();
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * CLI mode with arguments
 */
function cliSetup() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node scripts/create-model.js <name> <id> <domain>');
    console.log('Example: node scripts/create-model.js "Lisa Mueller" 12345678 lisa-mueller.com');
    console.log('\nOr run without arguments for interactive mode.');
    process.exit(1);
  }

  const [name, id, domain] = args;
  const username = slugify(name).replace(/-/g, '_');

  const configData = {
    name,
    username,
    id,
    domain,
    tagline: 'Dein Girl von nebenan',
    location: 'Deutschland',
    age: null,
    feedUrl: `https://www.mydirtyhobby.com/api/amateurvideos/?amateurId=${id}&limit=200&offset=0&language=de`,
    bio: generateSeoBio(name, ''),
    seoDescription: generateSeoDescription(name),
    primaryColor: '#e11d48',
    primaryHover: '#be123c',
    gradientTo: '#f43f5e'
  };

  const configContent = generateConfig(configData);
  const configPath = path.join(ROOT_DIR, 'config', 'site.config.js');

  fs.writeFileSync(configPath, configContent, 'utf8');
  log.success(`Configuration created for ${name}`);
}

// Run
if (process.argv.length > 2) {
  cliSetup();
} else {
  interactiveSetup();
}
