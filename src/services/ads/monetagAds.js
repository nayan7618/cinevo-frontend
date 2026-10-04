const monetagAds = {
  showBanner: async () => {
    console.log("Monetag banner requested");
    return null;
  },

  showInPage: async () => {
    console.log("Monetag in-page requested");
    return null;
  },

  showPopunder: async () => {
    console.log("Monetag popunder requested");
    return null;
  },

  getVideoAdTag: async () => {
    console.log("Monetag video ad requested");
    return null;
  },
};

export default monetagAds;