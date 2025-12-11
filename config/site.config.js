/**
 * Site Configuration Template
 *
 * SETUP:
 * 1. Copy this file to site.config.js
 * 2. Replace all PLACEHOLDER values with your model's data
 * 3. Run: npm run fetch-feed
 * 4. Run: npm run build
 */

export default {
  // Basic Site Info
  site: {
    name: "TexasPatti",                    // Model display name
    domain: "texaspatti.rocks",            // Domain without https://
    url: "https://texaspatti.rocks",       // Full URL with https://
    language: "de",
    locale: "de_DE"
  },

  // Model Information
  model: {
    id: "2796391",                        // MyDirtyHobby ID (from profile URL)
    name: "TexasPatti",                    // Display name
    username: "TexasPatti",            // MDH username
    tagline: "Der Lone Star der deutschen Erotikszene",

    // Profile URL (with your affiliate tracking)
    profileUrl: "https://www.mydirtyhobby.de/profil/2796391-TexasPatti",

    // Images (place in /src/assets/images/)
    avatar: "/images/avatar.png",
    headerImage: "/images/header.jpg",

    // About Section
    bio: `Von Münster bis Hollywood – Texas Patti hat sich den Stern verdient. Mit über 250 Produktionen und der Aufnahme in die AVN Hall of Fame 2025 ist sie Deutschlands heißester Export in die Welt der Erotik.`,

    // Extended SEO Content
    seoContent: {
      heroSubtitle: "AVN Hall of Fame 2025 ★ Über 250 Produktionen ★ Bekannt aus RTL2",
      aboutExtended: `Texas Patti, bürgerlich Bettina Habig, zählt zu den bekanntesten deutschen Erotikdarstellerinnen weltweit. Ihr Weg begann in einer Zahnarztpraxis in Münster und führte sie bis nach Hollywood zu den größten Studios der Branche.\n\nSeit 2017 ist sie festes Mitglied der amerikanischen Erotikszene und arbeitet mit Top-Produktionen wie Brazzers, Evil Angel und Jules Jordan zusammen. Als einzige Deutsche besitzt sie einen Exklusivvertrag bei OC Modeling.\n\nIhre authentische Art und die Verbindung zu ihren Fans machen sie zu einer Ausnahmeerscheinung in der Branche. Die RTL2-Dokumentation "Mein Leben am Höhepunkt" gewährte 2025 intime Einblicke in ihr Leben abseits der Kameras.`,
      whyWatch: `Texas Patti verbindet deutsche Bodenständigkeit mit amerikanischem Entertainment. Ihre Videos zeichnen sich durch Authentizität, Professionalität und echte Leidenschaft aus. Als AVN Hall of Fame Mitglied steht sie für höchste Qualität in der Erotikbranche.`,
      categories: ["Deutsche Pornodarstellerin", "AVN Hall of Fame", "Amateur", "Hardcore", "Gangbang", "Bukkake", "MILF", "Tattoo Girls", "Bisexuell"],
      metaKeywords: ["Texas Patti", "Texas Patti Videos", "Bettina Habig", "Deutsche Pornodarstellerin", "AVN Hall of Fame", "MyDirtyHobby", "Texas Patti Pornos", "Texas Patti RTL2"]
    },

    // Profile Details (optional - set to null if not applicable)
    details: {
      age: null,
      location: "Deutschland",
      bodyType: null,
      hairColor: null,
      eyeColor: null,
      height: null
    },

    // Social Links (set to null to hide)
    social: {
      instagram: null,
      twitter: null,
      tiktok: null,
      youtube: null,
      onlyfans: null
    }
  },

  // Video Feed Configuration
  feed: {
    // API URL - Replace MODEL_ID and ATS_TOKEN
    url: "https://www.mydirtyhobby.com/api/amateurvideos/?amateurId=2796391&ats=eyJhIjoyODQ4MTQsImMiOjQ5ODYzMzc3LCJuIjoyMSwicyI6MjQxLCJlIjo5NTQyLCJwIjoyfQ==&limit=200&offset=0&language=de&aboutme=1&softcore=hardcore",
    cacheFile: "data/videos.json",
    refreshInterval: 6,
    videoBaseUrl: "https://www.mydirtyhobby.de/video/",
    // Tracking parameters for all MDH links
    trackingParams: {
      ats: "eyJhIjoyODQ4MTQsImMiOjQ5ODYzMzc3LCJuIjoyMSwicyI6MjQxLCJlIjo5NTQyLCJwIjoyfQ==",                    // Your affiliate tracking string
      ad_id: "API",
      atc: "cal-texaspatti-rocks"              // Unique identifier (domain with dashes)
    }
  },

  // Theme Configuration
  theme: {
    primaryColor: "#e11d48",      // Rose-600
    primaryHover: "#be123c",      // Rose-700
    secondaryColor: "#1f2937",    // Gray-800
    accentColor: "#fbbf24",       // Amber-400
    bgPrimary: "#0f0f0f",
    bgSecondary: "#1a1a1a",
    bgCard: "#262626",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    gradientFrom: "#e11d48",
    gradientTo: "#f43f5e",
    borderRadius: "0.75rem"
  },

  // SEO Configuration
  seo: {
    description: "Entdecke exklusive Amateur-Videos. Authentische Inhalte und regelmäßige Updates.",
    keywords: [
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
    showViews: false,
    ctaButtonText: "Video ansehen",
    ctaButtonIcon: "play"
  },

  // Legal
  legal: {
    ageVerification: false,
    minimumAge: 18,
    privacyPolicyUrl: "/datenschutz",
    imprintUrl: "/impressum",
    termsUrl: "/agb"
  },

  // Analytics (optional)
  analytics: {
    googleAnalyticsId: null,
    matomo: {
      url: 'https://matomo.matchpanda.org',                           // e.g. "https://matomo.example.com/"
      siteId: 52                         // e.g. 1
    }
  },

  // SEO Meta Templates (use %name% for model name, %title% for video title)
  seoTemplates: {
    homeTitle: "▷ %name%: Geile Pornos und Live Cams",
    homeDescription: "llll➤ %name%: Geile Pornos & Live Cams ♥️ Alle heißen Videos des MyDirtyHobby Amateurs▶️ Jetzt kostenlos streamen 🎞️",
    videoTitle: "%name% ♥️ %title% 📹 Jetzt streamen",
    videoDescription: "▶️ %title% von %name% ♥️ Jetzt das exklusive Amateur-Video auf MyDirtyHobby ansehen 🎞️",
    videosTitle: "Alle Videos von %name% 📹 %count% exklusive Amateur-Videos",
    videosDescription: "llll➤ Alle %count% Videos von %name% ♥️ Exklusive Amateur-Inhalte auf MyDirtyHobby ▶️ Jetzt kostenlos streamen"
  }
};
