const googleAds = {
  showBanner: async () => {
    console.log("Google banner requested");
    return null;
  },

  showInPage: async () => {
    console.log("Google in-page requested");
    return null;
  },

  showPopunder: async () => {
    console.log("Google popunder requested");
    return null;
  },

  getVideoAdTag: async () => {
    console.log("Google video ad requested");
    return null;
  },
};

export default googleAds;