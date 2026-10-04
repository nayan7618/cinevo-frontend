const hilltopAds = {
  showBanner: async ({ zoneId, containerId } = {}) => {
    console.log("📺 Hilltop banner requested", {
      zoneId,
      containerId,
    });

    return {
      provider: "hilltop",
      type: "banner",
      zoneId,
    };
  },

  showInPage: async ({ zoneId } = {}) => {
    console.log("📱 Hilltop in-page requested", {
      zoneId,
    });

    return {
      provider: "hilltop",
      type: "in-page",
      zoneId,
    };
  },

  showPopunder: async ({ zoneId } = {}) => {
    console.log("🪟 Hilltop popunder requested", {
      zoneId,
    });

    return {
      provider: "hilltop",
      type: "popunder",
      zoneId,
    };
  },

  getVideoAdTag: async ({ zoneId } = {}) => {
    console.log("🎬 Hilltop VAST requested", {
      zoneId,
    });

    return null;
  },
};

export default hilltopAds;