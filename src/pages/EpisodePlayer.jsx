import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { ArrowLeft, ChevronDown, Check, Loader2 } from "lucide-react";

import VideoPlayer from "../components/VideoPlayer";
import AdManager from "@/components/AdManager";
import useVideoAds from "@/hooks/useVideoAds";
import HilltopPlayerBanner from "@/components/ads/HilltopPlayerBanner";
const Episode = () => {
  const { seriesId, episodeId } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);

  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  const [resumeTime, setResumeTime] = useState(0);

  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const [showSeasons, setShowSeasons] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // ADS
  // =====================================================

  const {
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
  } = useVideoAds();

  const [startVideoAfterAd, setStartVideoAfterAd] = useState(false);

  const [siteAdSettings, setSiteAdSettings] = useState({
    adsEnabled: true,
    preRollEnabled: true,
    midRollEnabled: true,
    postRollEnabled: true,
  });

  // =====================================================
  // REFS
  // =====================================================

  const lastSavedProgressRef = useRef(0);

  const latestProgressRef = useRef(0);

  const latestDurationRef = useRef(0);

  const lastVideoTimeRef = useRef(0);

  const activeSavePromiseRef = useRef(null);

  const midRollResumeTimeRef = useRef(0);

  // Next episode ko post-roll ke during preserve karenge
  const pendingNextEpisodeRef = useRef(null);

  // Same ended event ko dobara process hone se rokega
  const endedHandledRef = useRef(false);

  // One ViewEvent per episode playback
  const viewRecordedRef = useRef(false);

  // Main content video ko target karne ke liye
  // AdManager ke video ko accidentally target nahi karega
  const videoPlayerContainerRef = useRef(null);

  // =====================================================
  // GET MAIN VIDEO ELEMENT
  // =====================================================

  const getMainVideoElement = () => {
    return videoPlayerContainerRef.current?.querySelector("video") || null;
  };

  // =====================================================
  // LOAD SEASONS
  // =====================================================

  useEffect(() => {
    if (!episodeId) {
      return;
    }

    let cancelled = false;

    const loadCurrentEpisode = async () => {
      try {
        setLoading(true);
        setError("");

        // =================================================
        // RESET STATE
        // =================================================

        setCurrentEpisode(null);
        setResumeTime(0);

        latestProgressRef.current = 0;
        latestDurationRef.current = 0;
        lastSavedProgressRef.current = 0;

        lastVideoTimeRef.current = 0;

        viewRecordedRef.current = false;

        endedHandledRef.current = false;

        pendingNextEpisodeRef.current = null;

        midRollResumeTimeRef.current = 0;

        // =================================================
        // LOAD EPISODE + SETTINGS
        // =================================================

        const [episodeResponse, settingsResponse] = await Promise.all([
          api.get(`/episodes/${episodeId}`),

          api.get("/settings/public").catch(() => ({
            data: {
              success: false,
              settings: {},
            },
          })),
        ]);

        console.log("🎯 CURRENT EPISODE:", episodeResponse.data);

        const data =
          episodeResponse.data?.episode || episodeResponse.data?.data || null;

        const publicSettings = settingsResponse.data?.settings || {};

        const nextAdSettings = {
          adsEnabled: publicSettings.adsEnabled !== false,

          preRollEnabled: publicSettings.preRollEnabled !== false,

          midRollEnabled: publicSettings.midRollEnabled !== false,

          postRollEnabled: publicSettings.postRollEnabled !== false,
        };

        if (cancelled) {
          return;
        }

        if (!data) {
          throw new Error("Episode not found");
        }

        // =================================================
        // GET AUTHENTICATED SIGNED PLAYBACK
        // =================================================

        const playbackResponse = await api.get(
          `/watch-history/episode/${episodeId}`,
          {
            withCredentials: true,
          },
        );

        console.log("🔥 EPISODE PLAYBACK:", playbackResponse.data);

        if (!playbackResponse.data?.success) {
          throw new Error(
            playbackResponse.data?.message || "Failed to load episode playback",
          );
        }

        const playback = playbackResponse.data?.playback;

        const playbackVideo = playback?.video;

        // =================================================
        // SIGNED HLS URL CHECK
        // =================================================

        const signedHlsUrl =
          typeof playbackVideo?.hlsUrl === "string"
            ? playbackVideo.hlsUrl.trim()
            : "";

        const isPlayable =
          playbackVideo?.status === "READY" && signedHlsUrl.length > 0;

        if (!isPlayable) {
          console.log("⚠️ Episode is not playable:", {
            episodeId,
            title: data?.title,
            playbackVideo,
          });

          navigate(`/series/${seriesId}`, {
            replace: true,
          });

          return;
        }

        // =================================================
        // IMPORTANT
        // Replace public R2 URL with signed URL
        // =================================================

        const playableEpisode = {
          ...data,

          video: {
            ...(data.video || {}),

            id: playbackVideo?.id || data?.video?.id || null,

            hlsUrl: signedHlsUrl,

            quality: playbackVideo?.quality || data?.video?.quality || null,

            status: playbackVideo?.status || data?.video?.status || "READY",

            thumbnailUrl:
              playbackVideo?.thumbnailUrl ||
              data?.video?.thumbnailUrl ||
              data?.thumbnailUrl ||
              null,

            duration:
              playbackVideo?.duration ||
              data?.video?.duration ||
              data?.duration ||
              null,
          },
        };

        // =================================================
        // SET CURRENT EPISODE
        // =================================================

        setCurrentEpisode(playableEpisode);

        setSiteAdSettings(nextAdSettings);

        // =================================================
        // RESET ADS
        // =================================================

        resetAds();

        setStartVideoAfterAd(false);

        if (
          nextAdSettings.adsEnabled &&
          nextAdSettings.preRollEnabled &&
          shouldShowPreRoll()
        ) {
          markPreRollShown();

          console.log("📺 STARTING EPISODE PRE-ROLL AD");

          startAd("preRoll");
        } else {
          setStartVideoAfterAd(true);
        }

        // =================================================
        // SET SEASON
        // =================================================

        if (data?.seasonId) {
          setSelectedSeasonId(String(data.seasonId));
        }

        // =================================================
        // RESUME POSITION
        // =================================================

        const progress = Number(playback?.progressSeconds) || 0;

        const duration =
          Number(playback?.episode?.duration) ||
          Number(playableEpisode?.duration) ||
          Number(data?.duration) ||
          0;

        const completed = Boolean(playback?.completed);

        const safeResume = completed ? 0 : Math.max(progress, 0);

        if (!cancelled) {
          setResumeTime(safeResume);

          latestProgressRef.current = safeResume;

          latestDurationRef.current = duration;

          lastSavedProgressRef.current = safeResume;

          console.log("⏩ Resume position:", safeResume);

          console.log("✅ Episode completed:", completed);

          console.log("🔐 Signed HLS URL:", signedHlsUrl);
        }
      } catch (error) {
        console.error(
          "❌ Episode loading error:",
          error.response?.data || error.message || error,
        );

        if (!cancelled) {
          setCurrentEpisode(null);

          setError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load episode",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCurrentEpisode();

    return () => {
      cancelled = true;
    };
  }, [episodeId, seriesId, navigate]);

  // =====================================================
  // LOAD EPISODES FOR PUBLIC PAGE
  // =====================================================
  //
  // IMPORTANT:
  // Backend returns ALL episodes so Admin panel can
  // still see and manage episodes without videos.
  //
  // Public page only keeps:
  // status = READY
  // Signed HLS URL is fetched from the playback endpoint.
  // =====================================================

  useEffect(() => {
    if (!selectedSeasonId) {
      setEpisodes([]);
      return;
    }

    let cancelled = false;

    const loadEpisodes = async () => {
      try {
        setEpisodesLoading(true);

        const response = await api.get(`/episodes/season/${selectedSeasonId}`);

        console.log("📺 EPISODES:", response.data);

        const data =
          response.data?.episodes ||
          response.data?.data?.episodes ||
          response.data?.data ||
          [];

        const list = Array.isArray(data) ? [...data] : [];

        list.sort(
          (a, b) => Number(a.episodeNumber || 0) - Number(b.episodeNumber || 0),
        );

        // =================================================
        // PUBLIC FILTER
        // =================================================

        const playableEpisodes = list.filter(
          (item) => item?.video?.status === "READY",
        );

        console.log(
          "🎬 ALL EPISODES:",
          list.map((item) => ({
            id: item?.id,
            episodeNumber: item?.episodeNumber,
            videoStatus: item?.video?.status,
          })),
        );

        console.log("✅ PLAYABLE EPISODES:", playableEpisodes);

        if (!cancelled) {
          setEpisodes(playableEpisodes);
        }
      } catch (error) {
        console.error(
          "❌ Episodes error:",
          error.response?.data || error.message || error,
        );

        if (!cancelled) {
          setEpisodes([]);
        }
      } finally {
        if (!cancelled) {
          setEpisodesLoading(false);
        }
      }
    };

    loadEpisodes();

    return () => {
      cancelled = true;
    };
  }, [selectedSeasonId]);

  // =====================================================
  // CURRENT EPISODE INDEX
  // =====================================================

  const currentIndex = useMemo(() => {
    if (!episodeId) {
      return -1;
    }

    return episodes.findIndex((item) => String(item.id) === String(episodeId));
  }, [episodes, episodeId]);

  // =====================================================
  // PREVIOUS EPISODE
  // =====================================================

  const previousEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;

  // =====================================================
  // NEXT EPISODE
  // =====================================================

  const nextEpisode =
    currentIndex >= 0 && currentIndex < episodes.length - 1
      ? episodes[currentIndex + 1]
      : null;

  // =====================================================
  // CREATE EPISODE VIEW EVENT
  // =====================================================

  const createEpisodeViewEvent = async () => {
    if (!episodeId || viewRecordedRef.current) {
      return;
    }

    // Prevent duplicate calls
    viewRecordedRef.current = true;

    try {
      const response = await api.post("/views", {
        episodeId,
        watchedSeconds: 10,
      });

      if (response.data?.success) {
        console.log("👁️ Episode ViewEvent recorded:", episodeId);
      }
    } catch (error) {
      // Request fail hole retry allow korbo
      viewRecordedRef.current = false;

      console.error(
        "❌ Episode ViewEvent error:",
        error.response?.data || error.message || error,
      );
    }
  };

  // =====================================================
  // MID-ROLL CHECK
  // =====================================================

  const handleMidRollCheck = (currentTime) => {
    const numericCurrentTime = Number(currentTime);

    if (!Number.isFinite(numericCurrentTime)) {
      return;
    }

    // ---------------------------------------------
    // VIEW EVENT
    // ---------------------------------------------

    if (numericCurrentTime >= 10) {
      createEpisodeViewEvent();
    }

    // ---------------------------------------------
    // AD PLAYING
    // ---------------------------------------------

    if (isAdPlaying) {
      lastVideoTimeRef.current = numericCurrentTime;

      return;
    }

    // ---------------------------------------------
    // SEEK DETECTION
    // ---------------------------------------------

    const previousTime = lastVideoTimeRef.current;

    const timeDifference = numericCurrentTime - previousTime;

    if (timeDifference > 2 || timeDifference < -2) {
      console.log("⏩ Seek detected:", previousTime, "→", numericCurrentTime);

      lastVideoTimeRef.current = numericCurrentTime;

      return;
    }

    lastVideoTimeRef.current = numericCurrentTime;

    // ---------------------------------------------
    // MID ROLL CHECK
    // ---------------------------------------------

    if (!siteAdSettings.adsEnabled || !siteAdSettings.midRollEnabled) {
      return;
    }

    if (!shouldShowMidRoll(numericCurrentTime)) {
      return;
    }

    const videoElement = getMainVideoElement();

    if (!videoElement) {
      return;
    }

    // Hard pause content video
    videoElement.pause();

    videoElement.currentTime = numericCurrentTime;

    // Prevent content audio during ad
    videoElement.muted = true;

    midRollResumeTimeRef.current = numericCurrentTime;

    markMidRollShown(numericCurrentTime);

    console.log("📺 Starting episode mid-roll at:", numericCurrentTime);

    startAd("midRoll");
  };

  // =====================================================
  // FIND NEXT EPISODE
  // =====================================================

  const getNextEpisode = async () => {
    // ---------------------------------------------
    // LOCAL FILTERED LIST
    // ---------------------------------------------

    if (nextEpisode?.id) {
      console.log("✅ Next episode found locally:", nextEpisode);

      return nextEpisode;
    }

    // ---------------------------------------------
    // NO SEASON
    // ---------------------------------------------

    if (!selectedSeasonId) {
      return null;
    }

    // ---------------------------------------------
    // FETCH SEASON EPISODES
    // ---------------------------------------------

    try {
      console.log("🔄 Fetching next episode from season API...");

      const response = await api.get(`/episodes/season/${selectedSeasonId}`);

      const data =
        response.data?.episodes ||
        response.data?.data?.episodes ||
        response.data?.data ||
        [];

      const list = Array.isArray(data)
        ? [...data]
            .filter((item) => item?.video?.status === "READY")
            .sort(
              (a, b) =>
                Number(a.episodeNumber || 0) - Number(b.episodeNumber || 0),
            )
        : [];

      console.log("📦 Public playable episodes:", list);

      const index = list.findIndex(
        (item) => String(item.id) === String(episodeId),
      );

      console.log("📍 Current episode index:", index);

      if (index >= 0 && index < list.length - 1) {
        const fetchedNext = list[index + 1];

        console.log("🎯 Next playable episode:", fetchedNext);

        return fetchedNext;
      }
    } catch (error) {
      console.error(
        "❌ Failed to fetch next episode:",
        error.response?.data || error.message || error,
      );
    }

    return null;
  };

  // =====================================================
  // AD COMPLETE
  // =====================================================

  const handleAdComplete = async () => {
    const currentAdType = adType;

    console.log("✅ Ad completed:", currentAdType);

    endAd();

    // ===================================================
    // POST ROLL
    // ===================================================

    if (currentAdType === "postRoll") {
      let next = pendingNextEpisodeRef.current;

      console.log("🎯 Stored next episode:", next);

      if (!next?.id) {
        next = await getNextEpisode();
      }

      // No next episode
      if (!next?.id) {
        console.log("🏁 No next episode after post-roll");

        pendingNextEpisodeRef.current = null;

        return;
      }

      pendingNextEpisodeRef.current = null;

      console.log("🚀 Navigating after post-roll:", next.id);

      navigate(`/series/${seriesId}/episode/${next.id}`);

      return;
    }

    // ===================================================
    // MID ROLL
    // ===================================================

    if (currentAdType === "midRoll") {
      const videoElement = getMainVideoElement();

      if (videoElement) {
        try {
          videoElement.currentTime = midRollResumeTimeRef.current;

          videoElement.muted = false;

          await videoElement.play();

          console.log("▶️ Episode resumed after mid-roll");
        } catch (error) {
          console.warn("⚠️ Resume after mid-roll failed:", error);
        }
      }

      return;
    }

    // ===================================================
    // PRE ROLL
    // ===================================================

    if (currentAdType === "preRoll") {
      console.log("✅ Pre-roll completed");

      setStartVideoAfterAd(true);

      const videoElement = getMainVideoElement();

      if (videoElement) {
        try {
          videoElement.muted = false;

          await videoElement.play();

          console.log("▶️ Episode started after pre-roll");
        } catch (error) {
          console.warn("⚠️ Auto play after pre-roll failed:", error);
        }
      }
    }
  };

  // =====================================================
  // AD SKIP
  // =====================================================

  const handleAdSkip = async () => {
    console.log("⏭️ Ad skipped");

    await handleAdComplete();
  };

  // =====================================================
  // SAVE EPISODE PROGRESS
  // =====================================================

  const saveProgress = async (currentTime, duration, force = false) => {
    if (!episodeId) {
      return;
    }

    const numericCurrentTime = Number(currentTime);

    const numericDuration = Number(duration);

    if (
      !Number.isFinite(numericCurrentTime) ||
      !Number.isFinite(numericDuration) ||
      numericDuration <= 0 ||
      numericCurrentTime < 0
    ) {
      return;
    }

    const safeCurrentTime = Math.min(
      Math.max(numericCurrentTime, 0),
      numericDuration,
    );

    latestProgressRef.current = safeCurrentTime;

    latestDurationRef.current = numericDuration;

    // ---------------------------------------------
    // NORMAL SAVE EVERY 10 SEC
    // ---------------------------------------------

    if (
      !force &&
      safeCurrentTime - lastSavedProgressRef.current < 10 &&
      safeCurrentTime < numericDuration
    ) {
      return;
    }

    // ---------------------------------------------
    // PREVENT OVERLAPPING REQUESTS
    // ---------------------------------------------

    if (activeSavePromiseRef.current) {
      if (!force) {
        return;
      }

      try {
        await activeSavePromiseRef.current;
      } catch {
        // Continue
      }

      return saveProgress(
        latestProgressRef.current,
        latestDurationRef.current,
        true,
      );
    }

    // ---------------------------------------------
    // COMPLETION
    // ---------------------------------------------

    const completed = safeCurrentTime >= numericDuration * 0.9;

    const saveRequest = async () => {
      try {
        const response = await api.post(
          "/watch-history",
          {
            episodeId,

            progressSeconds: Math.floor(safeCurrentTime),

            duration: Math.floor(numericDuration),

            completed,
          },
          {
            withCredentials: true,
          },
        );

        if (response.data?.success) {
          lastSavedProgressRef.current = safeCurrentTime;

          console.log(
            "💾 Episode progress saved:",
            Math.floor(safeCurrentTime),
            "/",
            Math.floor(numericDuration),
          );
        }
      } catch (error) {
        console.error(
          "❌ Episode progress save error:",
          error.response?.data || error.message || error,
        );

        throw error;
      }
    };

    activeSavePromiseRef.current = saveRequest();

    try {
      await activeSavePromiseRef.current;
    } catch {
      // Error already logged
    } finally {
      activeSavePromiseRef.current = null;
    }
  };

  // =====================================================
  // SAVE BEFORE CHANGE
  // =====================================================

  const saveCurrentProgressBeforeChange = async () => {
    const currentTime = latestProgressRef.current;

    const duration = latestDurationRef.current;

    if (duration > 0 && currentTime >= 0) {
      await saveProgress(currentTime, duration, true);
    }
  };

  // =====================================================
  // SELECT EPISODE
  // =====================================================

  const selectEpisode = async (selectedEpisode) => {
    if (!selectedEpisode?.id) {
      return;
    }

    const playable = selectedEpisode?.video?.status === "READY";

    // Public side e only playable episode open hobe
    if (!playable) {
      console.log("⚠️ Episode video not ready:", selectedEpisode);

      return;
    }

    await saveCurrentProgressBeforeChange();

    navigate(`/series/${seriesId}/episode/${selectedEpisode.id}`);
  };

  // =====================================================
  // CHANGE SEASON
  // =====================================================

  const changeSeason = async (season) => {
    if (!season?.id) {
      return;
    }

    await saveCurrentProgressBeforeChange();

    setShowSeasons(false);

    setSelectedSeasonId(String(season.id));
  };

  // =====================================================
  // PREVIOUS
  // =====================================================

  const handlePrevious = async () => {
    if (!previousEpisode) {
      return;
    }

    await selectEpisode(previousEpisode);
  };

  // =====================================================
  // NEXT
  // =====================================================

  const handleNext = async () => {
    if (!nextEpisode) {
      return;
    }

    await selectEpisode(nextEpisode);
  };

  // =====================================================
  // EPISODE ENDED
  // =====================================================

  const handleEnded = async () => {
    if (endedHandledRef.current) {
      console.log("↩️ End event already handled:", episodeId);

      return;
    }

    endedHandledRef.current = true;

    console.log("✅ Episode completed:", episodeId);

    // ---------------------------------------------
    // MAKE SURE VIEW IS RECORDED
    // ---------------------------------------------

    await createEpisodeViewEvent();

    // ---------------------------------------------
    // SAVE COMPLETED PROGRESS
    // ---------------------------------------------

    const duration = latestDurationRef.current;

    if (duration > 0) {
      await saveProgress(duration, duration, true);
    }

    // ---------------------------------------------
    // FIND NEXT EPISODE
    // ---------------------------------------------

    const upcomingEpisode = await getNextEpisode();

    console.log("📌 Current episode:", episodeId);

    console.log("📌 Next episode:", upcomingEpisode);

    // ---------------------------------------------
    // PRESERVE NEXT EPISODE
    // ---------------------------------------------

    pendingNextEpisodeRef.current = upcomingEpisode?.id
      ? upcomingEpisode
      : null;

    // ---------------------------------------------
    // POST ROLL
    // ---------------------------------------------

    const showPostRoll =
      siteAdSettings.adsEnabled &&
      siteAdSettings.postRollEnabled &&
      shouldShowPostRoll();

    console.log("📺 Episode should show post-roll:", showPostRoll);

    if (showPostRoll) {
      markPostRollShown();

      const videoElement = getMainVideoElement();

      if (videoElement) {
        videoElement.pause();

        videoElement.muted = true;
      }

      console.log("📺 STARTING EPISODE POST-ROLL AD");

      startAd("postRoll");

      return;
    }

    // ---------------------------------------------
    // AUTO NEXT
    // ---------------------------------------------

    if (upcomingEpisode?.id) {
      pendingNextEpisodeRef.current = null;

      console.log("🚀 AUTO NEXT:", upcomingEpisode.id);

      navigate(`/series/${seriesId}/episode/${upcomingEpisode.id}`);

      return;
    }

    // ---------------------------------------------
    // LAST EPISODE
    // ---------------------------------------------

    pendingNextEpisodeRef.current = null;

    console.log("🏁 No next episode available");
  };

  // =====================================================
  // BACK TO SERIES
  // =====================================================

  const goBack = async () => {
    await saveCurrentProgressBeforeChange();

    navigate(`/series/${seriesId}`);
  };

  // =====================================================
  // COMPONENT UNMOUNT
  // =====================================================

  useEffect(() => {
    return () => {
      const currentTime = latestProgressRef.current;

      const duration = latestDurationRef.current;

      if (
        duration > 0 &&
        currentTime >= 0 &&
        currentTime !== lastSavedProgressRef.current
      ) {
        saveProgress(currentTime, duration, true);
      }
    };
  }, [episodeId]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 size={32} className="animate-spin text-red-600" />
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-white">
        <p className="text-lg font-semibold">Unable to load episode</p>

        <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
          {error}
        </p>

        <button
          type="button"
          onClick={goBack}
          className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  // =====================================================
  // EPISODE NOT FOUND
  // =====================================================

  if (!currentEpisode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] text-white">
        <p className="text-lg font-semibold">Episode not found</p>

        <button
          type="button"
          onClick={goBack}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  // =====================================================
  // VIDEO
  // =====================================================

  const video = currentEpisode.video;

  const videoStatus = video?.status;

  const hlsUrl =
    videoStatus === "READY" &&
    typeof video?.hlsUrl === "string" &&
    video.hlsUrl.trim().length > 0
      ? video.hlsUrl
      : null;
  // =====================================================
  // CURRENT SEASON
  // =====================================================

  const selectedSeason = seasons.find(
    (season) => String(season.id) === String(selectedSeasonId),
  );

  // =====================================================
  // FORMAT DURATION
  // =====================================================

  const formatDuration = (duration) => {
    const value = Number(duration);

    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    const totalMinutes = Math.floor(value / 60);

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] transition hover:bg-white/10"
            aria-label="Back to series"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Watching</p>

            <p className="truncate text-sm font-semibold">
              {currentEpisode.title}
            </p>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-3 pb-12 pt-4 sm:px-6 sm:pt-6">
        {/* =================================================
            PLAYER
        ================================================= */}

        <div className="overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/50">
          <div className="relative aspect-video">
            {/* ============================================
                AD MANAGER
            ============================================ */}

            {isAdPlaying && (
              <div className="absolute inset-0 z-50">
                <AdManager
                  adType={adType}
                  duration={15}
                  skipAfter={10}
                  onComplete={handleAdComplete}
                  onSkip={handleAdSkip}
                />
              </div>
            )}

            {/* ============================================
                VIDEO PLAYER
            ============================================ */}

            <div ref={videoPlayerContainerRef} className="absolute inset-0">
              {hlsUrl ? (
                <VideoPlayer
                  key={episodeId}
                  src={hlsUrl}
                  poster={video?.thumbnailUrl || currentEpisode.thumbnailUrl}
                  title={currentEpisode.title}
                  resumeTime={resumeTime}
                  onProgress={saveProgress}
                  onTimeUpdate={handleMidRollCheck}
                  onEnded={handleEnded}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  hasPrevious={Boolean(previousEpisode)}
                  hasNext={Boolean(nextEpisode?.video?.status === "READY")}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#101014]">
                  <p className="text-sm font-semibold text-zinc-300">
                    Video is not ready
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            TITLE / META
        ================================================= */}

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {selectedSeason && (
              <span>Season {selectedSeason.seasonNumber}</span>
            )}

            <span>•</span>

            <span>Episode {currentEpisode.episodeNumber}</span>

            {currentEpisode.duration && (
              <>
                <span>•</span>

                <span>{formatDuration(currentEpisode.duration)}</span>
              </>
            )}
          </div>

          <h1 className="mt-2 text-xl font-bold sm:text-2xl">
            {currentEpisode.title}
          </h1>

          {currentEpisode.description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              {currentEpisode.description}
            </p>
          )}
        </div>

        {/* =================================================
            SEASONS / EPISODES
        ================================================= */}

        <div className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Episodes</h2>

            {/* SEASON DROPDOWN */}

            {seasons.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSeasons((value) => !value)}
                  className="flex min-w-[150px] items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm transition hover:bg-white/[0.08]"
                >
                  <span>
                    {selectedSeason
                      ? `Season ${selectedSeason.seasonNumber}`
                      : "Season"}
                  </span>

                  <ChevronDown
                    size={16}
                    className={
                      showSeasons ? "rotate-180 transition" : "transition"
                    }
                  />
                </button>

                {showSeasons && (
                  <div className="absolute right-0 top-full z-40 mt-2 min-w-[180px] overflow-hidden rounded-lg border border-white/10 bg-[#151515] p-1 shadow-xl">
                    {seasons.map((season) => {
                      const active =
                        String(season.id) === String(selectedSeasonId);

                      return (
                        <button
                          key={season.id}
                          type="button"
                          onClick={() => changeSeason(season)}
                          className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "bg-red-600 text-white"
                              : "text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <span>Season {season.seasonNumber}</span>

                          {active && <Check size={15} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =================================================
              EPISODE LIST
          ================================================= */}

          <div className="mt-4">
            {episodesLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 size={16} className="animate-spin" />
                Loading episodes...
              </div>
            ) : episodes.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No playable episodes found.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {episodes.map((item) => {
                  const active = String(item.id) === String(episodeId);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectEpisode(item)}
                      title={`Episode ${item.episodeNumber}`}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                          : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white"
                      }`}
                    >
                      {item.episodeNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Episode;
