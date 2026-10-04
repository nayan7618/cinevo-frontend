import { useCallback, useRef, useState } from "react";
import { ADS_CONFIG } from "../config/ads";

const useVideoAds = () => {
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adType, setAdType] = useState(null);

  const preRollShownRef = useRef(false);
  const postRollShownRef = useRef(false);

  const midRollCountRef = useRef(0);
  const lastMidRollTimeRef = useRef(0);

  // =========================================================
  // START AD
  // =========================================================

  const startAd = useCallback((type) => {
    if (!ADS_CONFIG.enabled) {
      return false;
    }

    setAdType(type);
    setIsAdPlaying(true);

    return true;
  }, []);

  // =========================================================
  // END AD
  // =========================================================

  const endAd = useCallback(() => {
    setIsAdPlaying(false);
    setAdType(null);
  }, []);

  // =========================================================
  // PRE-ROLL
  // =========================================================

  const shouldShowPreRoll = useCallback(() => {
    if (!ADS_CONFIG.preRoll.enabled) {
      return false;
    }

    if (preRollShownRef.current) {
      return false;
    }

    if (
      preRollShownRef.current === false &&
      ADS_CONFIG.preRoll.maxAds > 0
    ) {
      return true;
    }

    return false;
  }, []);

  const markPreRollShown = useCallback(() => {
    preRollShownRef.current = true;
  }, []);

  // =========================================================
  // MID-ROLL
  // =========================================================

  const shouldShowMidRoll = useCallback(
    (currentTime) => {
      if (!ADS_CONFIG.midRoll.enabled) {
        return false;
      }

      if (
        midRollCountRef.current >=
        ADS_CONFIG.midRoll.maxAdsPerVideo
      ) {
        return false;
      }

      const intervalSeconds =
        ADS_CONFIG.midRoll.intervalMinutes * 60;

      if (currentTime < intervalSeconds) {
        return false;
      }

      if (
        currentTime -
          lastMidRollTimeRef.current <
        intervalSeconds
      ) {
        return false;
      }

      return true;
    },
    [],
  );

  const markMidRollShown = useCallback(
    (currentTime) => {
      midRollCountRef.current += 1;
      lastMidRollTimeRef.current = currentTime;
    },
    [],
  );

  // =========================================================
  // POST-ROLL
  // =========================================================

  const shouldShowPostRoll = useCallback(() => {
    if (!ADS_CONFIG.postRoll.enabled) {
      return false;
    }

    if (postRollShownRef.current) {
      return false;
    }

    if (ADS_CONFIG.postRoll.maxAds <= 0) {
      return false;
    }

    return true;
  }, []);

  const markPostRollShown = useCallback(() => {
    postRollShownRef.current = true;
  }, []);

  // =========================================================
  // RESET FOR NEW VIDEO
  // =========================================================

  const resetAds = useCallback(() => {
    setIsAdPlaying(false);
    setAdType(null);

    preRollShownRef.current = false;
    postRollShownRef.current = false;

    midRollCountRef.current = 0;
    lastMidRollTimeRef.current = 0;
  }, []);

  // =========================================================
  // EXPORT
  // =========================================================

  return {
    isAdPlaying,
    adType,

    startAd,
    endAd,

    shouldShowPreRoll,
    markPreRollShown,

    shouldShowMidRoll,
    markMidRollShown,

    shouldShowPostRoll,
    markPostRollShown,

    resetAds,
  };
};

export default useVideoAds;