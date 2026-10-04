import hilltopAds from "./hilltopAds";
import monetagAds from "./monetagAds";
import googleAds from "./googleAds";

const providers = {
  hilltop: hilltopAds,
  monetag: monetagAds,
  google: googleAds,
};

const ACTIVE_PROVIDER = "hilltop";
const getProvider = () => {
  return providers[ACTIVE_PROVIDER] || providers.hilltop;
};
const adService = {
  showBanner: async (options = {}) => {
    const provider = getProvider();
    if (!provider?.showBanner) {
      console.warn("Banner ad provider not avialble ");
      return null;
    }
    return provider.showBanner(options);
  },
  showInPage: async (options = {}) => {
    const provider = getProvider();
    if (!provider?.showInPage) {
      console.warn("In page ad provider unavailable");
      return null;
    }
    return provider.showInPage(options)
  },
  showPopunder: async (options = {}) =>{
    const provider = getProvider()
    if(!provider?.showPopunder){
        console.warn("Popunder ad provider unavilable ")
        return null
    }
  },
  getVideoTag: async (options = {} )=>{
    const provider  = getProvider();
    if(!provider?.getVideoAdTag){
        console.warn("Video ad provider unavailable")
        return null
    }
    return provider.getVideoAdTag(options)
  }
};

export default adService