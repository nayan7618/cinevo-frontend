export const ADS_CONFIG = {
  enabled: true,

  // Abhi development ke liye
  // "test" rakho.
  // Later: "hilltop", "monetag", "google"
  provider: "test",

  preRoll: {
    enabled: true,
    maxAds: 1,
  },

  midRoll: {
    enabled: true,

    // Har 15 minute mein check hoga
    intervalMinutes: 0.25,

    // Ek video mein currently sirf 1 mid-roll
    maxAdsPerVideo: 1,
  },

  postRoll: {
    enabled: true,
    maxAds: 1,
  },

  homeBanner: {
    enabled: true,
  },
};