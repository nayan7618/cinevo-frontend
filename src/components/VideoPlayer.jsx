import React, { useCallback, useEffect, useRef, useState } from "react";

import Hls from "hls.js";

import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Settings,
  Languages,
  Captions,
  AlertCircle,
  Loader2,
} from "lucide-react";

const VideoPlayer = ({
  src,
  poster,
  title,
  resumeTime = 0,
  autoPlay = true,

  fullscreenTargetRef = null,

  onProgress,
  onTimeUpdate,
  onEnded,
  onPrevious,
  onNext,

  hasPrevious = false,
  hasNext = false,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hlsRecoveryRef = useRef({
    networkRetries: 0,
    mediaRetries: 0,
    lastRecoveryAt: 0,
  });

  const progressSaveTimerRef = useRef(null);
  const hasAppliedResumeRef = useRef(false);

  const clickTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const lastTouchRef = useRef(0);
  const ignoreClickUntilRef = useRef(0);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [seekFeedback, setSeekFeedback] = useState(null);
  const seekFeedbackTimerRef = useRef(null);
  // =========================================================
  // PLAYER STATE
  // =========================================================

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState("");
  const [playerRetryKey, setPlayerRetryKey] = useState(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Buffered portion
  const [bufferedPercent, setBufferedPercent] = useState(0);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showControls, setShowControls] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);

  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(-1);

  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1);

  const [isSeeking, setIsSeeking] = useState(false);

  // =========================================================
  // DESTROY HLS
  // =========================================================

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (err) {
        console.warn("HLS destroy error:", err);
      }

      hlsRef.current = null;
    }
  }, []);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "00:00";
    }

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0",
      )}:${String(secs).padStart(2, "0")}`;
    }

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // =========================================================
  // CLOSE MENUS
  // =========================================================

  const closeAllMenus = () => {
    setShowSettings(false);
    setShowAudioMenu(false);
    setShowSubtitleMenu(false);
  };

  // =========================================================
  // CONTROLS TIMER
  // =========================================================

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);

    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        closeAllMenus();
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // VOLUME
  // =========================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // =========================================================
  // HLS INITIALIZATION
  // =========================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) {
      return;
    }

    let isMounted = true;
    let recoveryTimer = null;

    destroyHls();

    setError("");
    setIsPlaying(false);
    setIsBuffering(false);

    setCurrentTime(0);
    setDuration(0);
    setBufferedPercent(0);

    setQualities([]);
    setSelectedQuality(-1);

    setAudioTracks([]);
    setSelectedAudioTrack(-1);

    setSubtitleTracks([]);
    setSelectedSubtitleTrack(-1);

    hasAppliedResumeRef.current = false;

    hlsRecoveryRef.current = {
      networkRetries: 0,
      mediaRetries: 0,
      lastRecoveryAt: 0,
    };

    if (progressSaveTimerRef.current) {
      clearTimeout(progressSaveTimerRef.current);
      progressSaveTimerRef.current = null;
    }

    video.pause();
    video.removeAttribute("src");
    video.load();

    const clearRecoveryTimer = () => {
      if (recoveryTimer) {
        window.clearTimeout(recoveryTimer);
        recoveryTimer = null;
      }
    };

    const setPlaybackError = (message) => {
      if (!isMounted) return;

      clearRecoveryTimer();
      setIsBuffering(false);
      setError(message);
    };

    const scheduleRecovery = ({ type, recover }) => {
      if (!isMounted) return;

      const key = type === "network" ? "networkRetries" : "mediaRetries";

      const maxRetries = type === "network" ? 4 : 3;

      const currentRetries = Number(hlsRecoveryRef.current[key] || 0) + 1;

      hlsRecoveryRef.current[key] = currentRetries;

      if (currentRetries > maxRetries) {
        setPlaybackError(
          type === "network"
            ? "Video network error. Please retry playback."
            : "Video decoding error. Please retry playback.",
        );

        return;
      }

      const delay = Math.min(5000, 1000 * currentRetries);

      hlsRecoveryRef.current.lastRecoveryAt = Date.now();

      setIsBuffering(!video.paused);

      clearRecoveryTimer();

      console.warn(
        `HLS ${type} recovery attempt ${currentRetries}/${maxRetries} in ${delay}ms`,
      );

      recoveryTimer = window.setTimeout(() => {
        if (!isMounted) return;

        try {
          recover();
        } catch (recoveryError) {
          console.error(`HLS ${type} recovery failed:`, recoveryError);
        }
      }, delay);
    };

    // =======================================================
    // HLS.JS
    // =======================================================

    if (Hls.isSupported()) {
      console.log("🎬 Using HLS.js");

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,

        startLevel: -1,

        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        backBufferLength: 30,

        capLevelToPlayerSize: false,

        manifestLoadingMaxRetry: 2,
        manifestLoadingRetryDelay: 1000,

        levelLoadingMaxRetry: 2,
        levelLoadingRetryDelay: 1000,

        fragLoadingMaxRetry: 2,
        fragLoadingRetryDelay: 1000,

        maxBufferHole: 0.5,
        maxFragLookUpTolerance: 0.25,

        highBufferWatchdogPeriod: 2,
      });

      hlsRef.current = hls;

      // Signed HLS uses query-token authorization.
      hls.config.xhrSetup = (xhr) => {
        xhr.withCredentials = false;
      };

      // =====================================================
      // MEDIA ATTACHED
      // =====================================================

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        if (!isMounted) return;

        console.log("✅ HLS media attached");
      });

      // =====================================================
      // MANIFEST LOADING
      // =====================================================

      hls.on(Hls.Events.MANIFEST_LOADING, (_, data) => {
        if (!isMounted) return;

        console.log("📥 Loading HLS:", data?.url);
      });

      // =====================================================
      // MANIFEST PARSED
      // =====================================================

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (!isMounted) return;

        console.log("✅ HLS manifest parsed", data);

        // --------------------------------------------------
        // QUALITY
        // --------------------------------------------------

        const levels = hls.levels || [];

        const qualityList = levels
          .map((level, index) => ({
            index,
            width: Number(level.width) || 0,
            height: Number(level.height) || 0,
            bitrate:
              Number(level.bitrate) || Number(level.attrs?.BANDWIDTH) || 0,
          }))
          .filter((item) => item.height > 0)
          .sort((a, b) => b.height - a.height);

        setQualities(qualityList);
        setSelectedQuality(-1);

        console.log(
          "🎞️ Qualities:",
          qualityList.map((q) => `${q.height}p`),
        );

        // --------------------------------------------------
        // AUDIO
        // --------------------------------------------------

        const tracks = hls.audioTracks || [];

        if (tracks.length > 0) {
          const formattedAudio = tracks.map((track, index) => ({
            index,
            id: track.id,
            name:
              track.name ||
              track.lang ||
              track.language ||
              `Audio ${index + 1}`,

            lang: track.lang || track.language || "",

            groupId: track.groupId || "",

            default: Boolean(track.default),
          }));

          setAudioTracks(formattedAudio);

          const defaultAudioIndex = formattedAudio.findIndex(
            (track) => track.default,
          );

          const hlsAudioIndex = Number.isInteger(hls.audioTrack)
            ? hls.audioTrack
            : -1;

          const firstIndex =
            hlsAudioIndex >= 0 && hlsAudioIndex < formattedAudio.length
              ? hlsAudioIndex
              : defaultAudioIndex >= 0
                ? defaultAudioIndex
                : 0;

          setSelectedAudioTrack(firstIndex);

          try {
            hls.audioTrack = firstIndex;
          } catch (err) {
            console.warn("Audio track selection error:", err);
          }

          console.log("🔊 Audio tracks:", formattedAudio);
        } else {
          setAudioTracks([]);
          setSelectedAudioTrack(-1);
        }

        // --------------------------------------------------
        // SUBTITLES
        // --------------------------------------------------
        // --------------------------------------------------
        // SUBTITLES
        // --------------------------------------------------

        const updateSubtitleTracks = (tracks = []) => {
          const formattedSubtitles = tracks.map((track, index) => ({
            index,
            id: track.id,

            name:
              track.name ||
              track.lang ||
              track.language ||
              `Subtitle ${index + 1}`,

            lang: track.lang || track.language || "",

            groupId: track.groupId || "",

            default: Boolean(track.default),

            forced: Boolean(track.forced),
          }));

          setSubtitleTracks(formattedSubtitles);

          const defaultSubtitleIndex = formattedSubtitles.findIndex(
            (track) => track.default,
          );

          const activeSubtitleIndex = Number.isInteger(hls.subtitleTrack)
            ? hls.subtitleTrack
            : -1;

          setSelectedSubtitleTrack(
            activeSubtitleIndex >= 0 &&
              activeSubtitleIndex < formattedSubtitles.length
              ? activeSubtitleIndex
              : defaultSubtitleIndex >= 0
                ? defaultSubtitleIndex
                : -1,
          );

          console.log("💬 Subtitle tracks:", formattedSubtitles);
        };

        // MANIFEST PARSED
        updateSubtitleTracks(data?.subtitleTracks || hls.subtitleTracks || []);

        // SUBTITLE TRACKS UPDATED
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, subtitleData) => {
          if (!isMounted) return;

          updateSubtitleTracks(
            subtitleData?.subtitleTracks || hls.subtitleTracks || [],
          );
        });
      });

      // =====================================================
      // AUDIO TRACKS UPDATED
      // =====================================================

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (!isMounted) return;

        const tracks = data?.audioTracks || hls.audioTracks || [];

        const formattedAudio = tracks.map((track, index) => ({
          index,
          id: track.id,

          name:
            track.name || track.lang || track.language || `Audio ${index + 1}`,

          lang: track.lang || track.language || "",

          groupId: track.groupId || "",

          default: Boolean(track.default),
        }));

        setAudioTracks(formattedAudio);

        const activeIndex = Number(hls.audioTrack);

        setSelectedAudioTrack(
          Number.isInteger(activeIndex) &&
            activeIndex >= 0 &&
            activeIndex < formattedAudio.length
            ? activeIndex
            : formattedAudio.length > 0
              ? 0
              : -1,
        );
      });

      // =====================================================
      // SUBTITLE TRACK SWITCH
      // =====================================================

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => {
        if (!isMounted) return;

        if (typeof data?.id === "number") {
          setSelectedSubtitleTrack(data.id);
        }
      });

      // =====================================================
      // QUALITY SWITCH
      // =====================================================

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (!isMounted) return;

        const index = Number(data?.level);

        if (index === -1) {
          setSelectedQuality(-1);
          return;
        }

        setSelectedQuality(index);

        const level = hls.levels[index];

        if (level) {
          console.log(`📺 Quality switched: ${level.height}p`);
        }
      });

      // =====================================================
      // AUDIO SWITCH
      // =====================================================

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        if (!isMounted) return;

        if (typeof data?.id === "number") {
          setSelectedAudioTrack(data.id);
        }
      });

      // =====================================================
      // HLS ERROR
      // ONLY ONE ERROR HANDLER
      // =====================================================

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!isMounted || !data) {
          return;
        }

        // Recoverable buffer gap
        if (!data.fatal) {
          if (data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
            const currentVideo = videoRef.current;

            if (currentVideo && Number.isFinite(currentVideo.currentTime)) {
              try {
                const buffered = currentVideo.buffered;

                for (let i = 0; i < buffered.length; i += 1) {
                  const start = buffered.start(i);

                  const end = buffered.end(i);

                  if (
                    currentVideo.currentTime < start &&
                    start - currentVideo.currentTime < 1
                  ) {
                    currentVideo.currentTime = start + 0.05;

                    break;
                  }

                  if (
                    currentVideo.currentTime >= start &&
                    currentVideo.currentTime <= end
                  ) {
                    break;
                  }
                }
              } catch (seekError) {
                console.warn("Buffer-hole recovery failed:", seekError);
              }
            }
          }

          return;
        }

        console.error("❌ Fatal HLS error:", data);

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            scheduleRecovery({
              type: "network",

              recover: () => {
                if (!hlsRef.current || hlsRef.current !== hls) {
                  return;
                }

                hls.startLoad(-1);
              },
            });

            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            scheduleRecovery({
              type: "media",

              recover: () => {
                if (!hlsRef.current || hlsRef.current !== hls) {
                  return;
                }

                hls.recoverMediaError();
              },
            });

            break;

          default:
            setPlaybackError("Video playback error. Please retry playback.");

            break;
        }
      });

      // =====================================================
      // LOAD + ATTACH
      // =====================================================

      try {
        hls.loadSource(src);
        hls.attachMedia(video);
      } catch (loadError) {
        console.error("HLS initialization failed:", loadError);

        setPlaybackError("Unable to initialize HLS playback.");
      }
    }

    // =======================================================
    // SAFARI NATIVE HLS
    // =======================================================
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("🍎 Using native HLS");

      try {
        video.src = src;
        video.load();
      } catch (nativeError) {
        console.error("Native HLS initialization failed:", nativeError);

        setPlaybackError("Unable to initialize HLS playback.");
      }
    }

    // =======================================================
    // UNSUPPORTED
    // =======================================================
    else {
      setPlaybackError(
        "Is browser mein HLS video playback supported nahi hai.",
      );
    }

    return () => {
      isMounted = false;

      clearRecoveryTimer();

      destroyHls();

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, destroyHls, playerRetryKey]);

  // =========================================================
  // BUFFER + VIDEO EVENTS
  // =========================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // -------------------------------------------------------
    // BUFFERED %
    // -------------------------------------------------------

    const updateBufferedProgress = () => {
      const videoDuration = video.duration;

      if (!Number.isFinite(videoDuration) || videoDuration <= 0) {
        setBufferedPercent(0);
        return;
      }

      try {
        const buffered = video.buffered;

        const current = video.currentTime || 0;

        let bufferedEnd = 0;

        for (let i = 0; i < buffered.length; i += 1) {
          const start = buffered.start(i);

          const end = buffered.end(i);

          // Current position ke
          // range ka end use karo
          if (current >= start && current <= end) {
            bufferedEnd = end;
            break;
          }

          if (end > bufferedEnd) {
            bufferedEnd = end;
          }
        }

        const percent = Math.min(
          100,
          Math.max(0, (bufferedEnd / videoDuration) * 100),
        );

        setBufferedPercent(percent);
      } catch (err) {
        console.warn("Buffered progress update failed:", err);
      }
    };

    // -------------------------------------------------------
    // METADATA
    // -------------------------------------------------------

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);

      updateBufferedProgress();

      console.log("✅ Metadata loaded:", video.duration);
    };

    // -------------------------------------------------------
    // CAN PLAY
    // -------------------------------------------------------

    const handleCanPlay = () => {
      setIsBuffering(false);

      updateBufferedProgress();

      console.log("▶️ Video can play");
    };

    // -------------------------------------------------------
    // WAITING
    // Spinner ONLY while actually playing
    // -------------------------------------------------------

    const handleWaiting = () => {
      updateBufferedProgress();

      if (!video.paused) {
        setIsBuffering(true);
      }
    };

    // -------------------------------------------------------
    // PLAYING
    // -------------------------------------------------------

    const handlePlaying = () => {
      setIsBuffering(false);
      updateBufferedProgress();
      setIsPlaying(true);

      // Successful playback = recovery counters reset
      if (hlsRecoveryRef.current) {
        hlsRecoveryRef.current.networkRetries = 0;
        hlsRecoveryRef.current.mediaRetries = 0;
      }
    };

    // -------------------------------------------------------
    // PROGRESS
    // -------------------------------------------------------

    const handleProgress = () => {
      updateBufferedProgress();
    };

    // -------------------------------------------------------
    // PAUSE
    // -------------------------------------------------------

    const handlePause = () => {
      setIsPlaying(false);

      // Paused state mein spinner kabhi nahi
      setIsBuffering(false);
    };

    // -------------------------------------------------------
    // ENDED
    // -------------------------------------------------------

    const handleEnded = () => {
      setIsPlaying(false);
      setIsBuffering(false);

      if (onEnded) {
        onEnded();
      }
    };

    // -------------------------------------------------------
    // TIME UPDATE
    // -------------------------------------------------------

    const handleTimeUpdate = () => {
      const time = video.currentTime || 0;

      setCurrentTime(time);

      // ---------------------------------------------
      // VIEW TRACKING / ADS / MID-ROLL
      // ---------------------------------------------

      if (onTimeUpdate) {
        onTimeUpdate(time);
      }

      // ---------------------------------------------
      // WATCH HISTORY / PROGRESS
      // ---------------------------------------------

      if (onProgress) {
        if (progressSaveTimerRef.current) {
          clearTimeout(progressSaveTimerRef.current);
        }

        progressSaveTimerRef.current = setTimeout(() => {
          onProgress(time, video.duration || 0);
        }, 800);
      }
    };

    // -------------------------------------------------------
    // HTML5 ERROR
    // -------------------------------------------------------
    const handleError = () => {
      if (!video.error) {
        return;
      }

      console.error("❌ HTML5 video error:", video.error);

      setIsBuffering(false);

      if (!hlsRef.current) {
        setError("Video playback error. Please retry playback.");
      }
    };

    // -------------------------------------------------------
    // LOADED DATA
    // -------------------------------------------------------

    const handleLoadedData = () => {
      updateBufferedProgress();

      console.log("✅ Video data loaded");
    };

    // =======================================================
    // EVENT LISTENERS
    // =======================================================

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    video.addEventListener("progress", handleProgress);

    video.addEventListener("canplay", handleCanPlay);

    video.addEventListener("waiting", handleWaiting);

    video.addEventListener("playing", handlePlaying);

    video.addEventListener("pause", handlePause);

    video.addEventListener("ended", handleEnded);

    video.addEventListener("timeupdate", handleTimeUpdate);

    video.addEventListener("error", handleError);

    video.addEventListener("loadeddata", handleLoadedData);

    // =======================================================
    // IMPORTANT:
    // HLS buffered range ko continuously update karo.
    // Isse grey buffered bar visible rahega.
    // =======================================================

    const bufferInterval = setInterval(() => {
      updateBufferedProgress();
    }, 250);

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      video.removeEventListener("progress", handleProgress);

      video.removeEventListener("canplay", handleCanPlay);

      video.removeEventListener("waiting", handleWaiting);

      video.removeEventListener("playing", handlePlaying);

      video.removeEventListener("pause", handlePause);

      video.removeEventListener("ended", handleEnded);

      video.removeEventListener("timeupdate", handleTimeUpdate);

      video.removeEventListener("error", handleError);

      video.removeEventListener("loadeddata", handleLoadedData);

      clearInterval(bufferInterval);

      if (progressSaveTimerRef.current) {
        clearTimeout(progressSaveTimerRef.current);

        progressSaveTimerRef.current = null;
      }
    };
  }, [onEnded, onProgress, onTimeUpdate]);

  // =========================================================
  // RESUME PLAYBACK
  // =========================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const resume = Number(resumeTime) || 0;

    // No saved position
    if (resume <= 0) {
      hasAppliedResumeRef.current = true;
      return;
    }

    // New resume value received
    hasAppliedResumeRef.current = false;

    const applyResume = () => {
      if (hasAppliedResumeRef.current) {
        return true;
      }

      const videoDuration = Number(video.duration);

      // HLS duration ekhono ready na
      if (!Number.isFinite(videoDuration) || videoDuration <= 0) {
        return false;
      }

      // Saved position already at/end
      if (resume >= videoDuration) {
        hasAppliedResumeRef.current = true;
        return true;
      }

      const safeResume = Math.max(0, Math.min(resume, videoDuration - 0.5));

      try {
        video.currentTime = safeResume;
        setCurrentTime(safeResume);

        hasAppliedResumeRef.current = true;

        console.log(
          "⏩ Resume time applied:",
          safeResume,
          "/ duration:",
          videoDuration,
        );

        return true;
      } catch (err) {
        console.warn("Resume time apply failed:", err);

        return false;
      }
    };

    // Try immediately
    if (applyResume()) {
      return;
    }

    // HLS/native video ready events
    const handleLoadedMetadata = () => {
      applyResume();
    };

    const handleDurationChange = () => {
      applyResume();
    };

    const handleLoadedData = () => {
      applyResume();
    };

    const handleCanPlay = () => {
      applyResume();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    video.addEventListener("durationchange", handleDurationChange);

    video.addEventListener("loadeddata", handleLoadedData);

    video.addEventListener("canplay", handleCanPlay);

    // HLS duration sometimes arrives slightly later
    const retryTimer = window.setInterval(() => {
      if (applyResume()) {
        window.clearInterval(retryTimer);
      }
    }, 200);

    const stopTimer = window.setTimeout(() => {
      window.clearInterval(retryTimer);
    }, 10000);

    return () => {
      window.clearInterval(retryTimer);
      window.clearTimeout(stopTimer);

      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      video.removeEventListener("durationchange", handleDurationChange);

      video.removeEventListener("loadeddata", handleLoadedData);

      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [resumeTime]);
  // =========================================================
  // AUTO PLAY
  // =========================================================

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !autoPlay) {
      return;
    }

    const startPlayback = async () => {
      try {
        // Resume position available thakle ensure kore set koro
        const resume = Number(resumeTime) || 0;
        const videoDuration = Number(video.duration);

        if (
          resume > 0 &&
          Number.isFinite(videoDuration) &&
          videoDuration > resume &&
          !hasAppliedResumeRef.current
        ) {
          const safeResume = Math.min(resume, videoDuration - 0.5);

          video.currentTime = safeResume;
          setCurrentTime(safeResume);

          hasAppliedResumeRef.current = true;

          console.log("⏩ Autoplay resume position:", safeResume);
        }

        await video.play();

        console.log("▶️ Video autoplay started");
      } catch (error) {
        console.warn("⚠️ Autoplay blocked by browser:", error);
      }
    };

    // Video already ready
    if (video.readyState >= 2) {
      startPlayback();
      return;
    }

    // Wait until video can play
    video.addEventListener("canplay", startPlayback, { once: true });

    return () => {
      video.removeEventListener("canplay", startPlayback);
    };
  }, [autoPlay, resumeTime, playerRetryKey]);

  // =========================================================
  // PLAY / PAUSE
  // =========================================================

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("Play error:", err);

      setError(
        "Video play nahi ho pa raha. Browser playback permission check karo.",
      );
    }

    resetControlsTimer();
  };

  // =========================================================
  // SEEK
  // =========================================================

  const seekBy = (seconds) => {
    const video = videoRef.current;

    if (!video) return;

    const newTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds),
    );

    video.currentTime = newTime;

    setCurrentTime(newTime);

    resetControlsTimer();
  };

  const handleProgressChange = (event) => {
    const video = videoRef.current;

    if (!video) return;

    const value = Number(event.target.value);

    if (!Number.isFinite(value)) {
      return;
    }

    video.currentTime = value;
    setCurrentTime(value);
  };

  // =========================================================
  // VOLUME
  // =========================================================

  const handleVolumeChange = (event) => {
    const value = Number(event.target.value);

    setVolume(value);

    if (value > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // =========================================================
  // QUALITY
  // =========================================================

  const changeQuality = (levelIndex) => {
    const hls = hlsRef.current;
    const video = videoRef.current;

    if (!hls || !video) return;

    // ============================================
    // AUTO QUALITY
    // ============================================

    if (levelIndex === -1) {
      hls.currentLevel = -1;
      hls.nextLevel = -1;

      setSelectedQuality(-1);

      console.log("📺 Quality: AUTO");

      setShowSettings(false);
      resetControlsTimer();

      return;
    }

    // ============================================
    // VALIDATE QUALITY
    // ============================================

    if (levelIndex < 0 || levelIndex >= hls.levels.length) {
      console.warn("Invalid quality level:", levelIndex);

      return;
    }

    const level = hls.levels[levelIndex];

    // Current playback state
    const currentTime = video.currentTime || 0;
    const wasPlaying = !video.paused;

    // ============================================
    // SWITCH QUALITY
    //
    // nextLevel = current segment complete hone
    // ke baad new quality use karega.
    // Isse playback unnecessarily interrupt nahi hota.
    // ============================================

    hls.nextLevel = levelIndex;

    setSelectedQuality(levelIndex);

    console.log(
      "📺 Switching quality:",
      level?.height ? `${level.height}p` : levelIndex,
    );

    // ============================================
    // SAFETY:
    // Kuch HLS/browser situations mein quality
    // switch ke baad position jump ho sakti hai.
    // Position preserve karne ke liye monitor karo.
    // ============================================

    const restorePosition = () => {
      const currentVideo = videoRef.current;

      if (!currentVideo) return;

      try {
        const maxTime = Number.isFinite(currentVideo.duration)
          ? Math.max(currentVideo.duration - 0.5, 0)
          : currentTime;

        const safeTime = Math.min(currentTime, maxTime);

        if (
          Number.isFinite(safeTime) &&
          Math.abs(currentVideo.currentTime - safeTime) > 1
        ) {
          currentVideo.currentTime = safeTime;
        }

        if (wasPlaying && currentVideo.paused) {
          currentVideo.play().catch((err) => {
            console.warn("Playback resume after quality switch failed:", err);
          });
        }
      } catch (err) {
        console.warn("Position restore failed:", err);
      }
    };

    // Give HLS a little time to switch
    window.setTimeout(restorePosition, 300);

    setShowSettings(false);
    resetControlsTimer();
  };

  // =========================================================
  // AUDIO
  // =========================================================

  const changeAudioTrack = (trackIndex) => {
    const hls = hlsRef.current;

    if (!hls) {
      return;
    }

    if (trackIndex < 0 || trackIndex >= (hls.audioTracks?.length || 0)) {
      return;
    }

    try {
      hls.audioTrack = trackIndex;

      setSelectedAudioTrack(trackIndex);

      console.log("🔊 Audio track:", hls.audioTracks[trackIndex]);
    } catch (err) {
      console.error("Audio track change failed:", err);
    }

    setShowAudioMenu(false);

    resetControlsTimer();
  };

  // =========================================================
  // SUBTITLES
  // =========================================================

  const changeSubtitleTrack = (trackIndex) => {
    const hls = hlsRef.current;

    if (!hls) {
      return;
    }

    try {
      hls.subtitleTrack = trackIndex;

      setSelectedSubtitleTrack(trackIndex);

      console.log("💬 Subtitle track:", trackIndex);
    } catch (err) {
      console.error("Subtitle track change failed:", err);
    }

    setShowSubtitleMenu(false);

    resetControlsTimer();
  };
  // =========================================================
  // FULLSCREEN
  // =========================================================

  const isMobileDevice = () => {
    if (typeof window === "undefined") {
      return false;
    }

    const hasTouch =
      typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    return hasTouch || hasCoarsePointer;
  };

  const lockLandscape = async () => {
    if (!isMobileDevice()) return;

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock("landscape");
        console.log("📱 Mobile fullscreen → landscape locked");
      }
    } catch (err) {
      console.warn("Landscape lock not supported:", err);
    }
  };

  const unlockOrientation = () => {
    if (!isMobileDevice()) return;

    try {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
        console.log("📱 Orientation unlocked");
      }
    } catch (err) {
      console.warn("Orientation unlock failed:", err);
    }
  };

  const toggleFullscreen = async () => {
    const fullscreenTarget =
      fullscreenTargetRef?.current || containerRef.current;

    if (!fullscreenTarget) {
      console.warn("Fullscreen target not found");
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await fullscreenTarget.requestFullscreen();

        if (isMobileDevice()) {
          await lockLandscape();
        }
      } else {
        await document.exitFullscreen();
        unlockOrientation();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (event) => {
    if (!isFullscreen || event.touches.length !== 2) {
      return;
    }

    const distance = getTouchDistance(event.touches[0], event.touches[1]);

    pinchStartDistanceRef.current = distance;
    pinchStartZoomRef.current = zoom;
  };

  const handleTouchMove = (event) => {
    if (
      !isFullscreen ||
      event.touches.length !== 2 ||
      !pinchStartDistanceRef.current
    ) {
      return;
    }

    event.preventDefault();

    const distance = getTouchDistance(event.touches[0], event.touches[1]);

    const scaleChange = distance / pinchStartDistanceRef.current;

    const nextZoom = Math.min(
      Math.max(pinchStartZoomRef.current * scaleChange, 1),
      2,
    );

    setZoom(Number(nextZoom.toFixed(2)));
  };
  const showSeekFeedback = (direction) => {
    setSeekFeedback(direction);

    if (seekFeedbackTimerRef.current) {
      clearTimeout(seekFeedbackTimerRef.current);
    }

    seekFeedbackTimerRef.current = setTimeout(() => {
      setSeekFeedback(null);
    }, 550);
  };
  const handleTouchEnd = (event) => {
    // Prevent the synthetic click generated after touch
    // from triggering desktop play/pause logic.
    ignoreClickUntilRef.current = Date.now() + 500;
    // Always reset pinch state
    pinchStartDistanceRef.current = 0;

    if (!isMobileDevice()) {
      return;
    }

    // Ignore multi-touch endings
    if (event.touches?.length > 0) {
      return;
    }

    const touch = event.changedTouches?.[0];

    if (!touch) {
      return;
    }

    const now = Date.now();
    const lastTouch = lastTouchRef.current;

    const isDoubleTap = lastTouch > 0 && now - lastTouch < 320;

    // First tap
    if (!isDoubleTap) {
      lastTouchRef.current = now;
      return;
    }

    // Double tap detected
    lastTouchRef.current = 0;

    const video = videoRef.current;

    if (!video) {
      return;
    }

    const rect = video.getBoundingClientRect();

    const touchX = touch.clientX - rect.left;

    const isRightSide = touchX >= rect.width / 2;

    if (isRightSide) {
      // Right double tap → +10 sec
      seekBy(10);
      showSeekFeedback("right");
    } else {
      // Left double tap → -10 sec
      seekBy(-10);
      showSeekFeedback("left");
    }
  };
  useEffect(() => {
    const handleFullscreenChange = async () => {
      const fullscreen = Boolean(document.fullscreenElement);

      setIsFullscreen(fullscreen);

      if (fullscreen) {
        await lockLandscape();
      } else {
        unlockOrientation();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      unlockOrientation();
    };
  }, []);

  // =========================================================
  // KEYBOARD
  // =========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase();

      if (tag === "input" || tag === "textarea" || tag === "button") {
        return;
      }

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();

          togglePlay();

          break;

        case "ArrowLeft":
          event.preventDefault();

          seekBy(-5);

          break;

        case "ArrowRight":
          event.preventDefault();

          seekBy(5);

          break;

        case "m":
        case "M":
          event.preventDefault();

          toggleMute();

          break;

        case "f":
        case "F":
          event.preventDefault();

          toggleFullscreen();

          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  // =========================================================
  // PREVIOUS
  // =========================================================

  const handlePrevious = () => {
    if (!hasPrevious || !onPrevious) {
      return;
    }

    videoRef.current?.pause();

    onPrevious();
  };

  // =========================================================
  // NEXT
  // =========================================================

  const handleNext = () => {
    if (!hasNext || !onNext) {
      return;
    }

    videoRef.current?.pause();

    onNext();
  };

  // =========================================================
  // SINGLE / DOUBLE CLICK + MOBILE DOUBLE TAP
  // =========================================================

  const handleVideoClick = () => {
    // Ignore browser-generated click after touch.
    if (Date.now() < ignoreClickUntilRef.current) {
      return;
    }

    // Mobile/tablet single tap should do nothing.
    if (isMobileDevice()) {
      return;
    }

    // Desktop: existing play/pause behavior.
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      togglePlay();
      clickTimerRef.current = null;
    }, 220);
  };

  const handleVideoDoubleClick = () => {
    // Mobile double tap handled by touch.
    if (isMobileDevice()) {
      return;
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);

      clickTimerRef.current = null;
    }

    // Desktop → fullscreen
    toggleFullscreen();
  };

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }

      lastTouchRef.current = 0;
    };
  }, []);

  // =========================================================
  // PROGRESS
  // =========================================================

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  const visibleBufferedPercent = Math.max(progressPercent, bufferedPercent);
  // =========================================================
  // MAIN UI
  // =========================================================
  const isTouchDevice =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  return (
    <div
      ref={containerRef}
      className={`cinebox-video-player ${
        isFullscreen
          ? "relative h-full w-full overflow-hidden bg-black"
          : "relative mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-2xl bg-black shadow-2xl"
      }`}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      {/* ===================================================
          VIDEO
      =================================================== */}

      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata"
        className={
          isFullscreen
            ? `block h-full w-full bg-black ${
                isTouchDevice ? "object-contain" : "object-cover"
              }`
            : "block aspect-video w-full bg-black object-contain"
        }
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          touchAction: isTouchDevice ? "manipulation" : "auto",
        }}
        crossOrigin="anonymous"
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {seekFeedback === "left" && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-40 flex w-1/2 items-center justify-center">
          <div className="cinebox-seek-left rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold leading-none">{"<<"}</span>
              <span className="text-xs font-medium">10s</span>
            </div>
          </div>
        </div>
      )}

      {seekFeedback === "right" && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-40 flex w-1/2 items-center justify-center">
          <div className="cinebox-seek-right rounded-full bg-black/40 px-3 py-2 text-white backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">10s</span>
              <span className="text-2xl font-bold leading-none">{">>"}</span>
            </div>
          </div>
        </div>
      )}
      {/* ===================================================
          BUFFERING SPINNER
          Sirf actual playback buffering par show hoga.
          Pause karne par spinner nahi aayega.
      =================================================== */}

      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="rounded-full bg-black/60 p-4 backdrop-blur-sm">
            <Loader2 size={34} className="animate-spin text-white" />
          </div>
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-6">
          <div className="max-w-md text-center">
            <AlertCircle size={42} className="mx-auto mb-4 text-red-400" />

            <p className="text-sm leading-6 text-white">{error}</p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setIsBuffering(true);

                setPlayerRetryKey((prev) => prev + 1);
              }}
              className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <div
        className={`absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 pb-12 pt-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white sm:text-lg">
              {title || "Video"}
            </h2>
          </div>
        </div>
      </div>

      {/* ===================================================
          CENTER PLAY BUTTON
      =================================================== */}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        {!isPlaying && !isBuffering && !error && (
          <button
            type="button"
            onClick={togglePlay}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition hover:scale-105 hover:bg-white sm:h-20 sm:w-20"
          >
            <Play size={32} fill="currentColor" className="ml-1" />
          </button>
        )}
      </div>

      {/* ===================================================
          BOTTOM CONTROLS
      =================================================== */}

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-3 pt-16 transition-opacity duration-300 sm:px-5 sm:pb-5 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* =================================================
            CUSTOM SEEK BAR

            Layer order:

            1. Background track
            2. Grey buffered
            3. Red played
            4. Transparent input on top

            Isliye native range ka background
            grey/red ko hide nahi karega.
        ================================================= */}

        <div className="relative mb-3 flex h-5 w-full items-center">
          {/* Background / remaining */}
          <div className="pointer-events-none absolute left-0 right-0 h-1.5 rounded-full bg-white/20" />

          {/* Buffered */}
          <div
            className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-zinc-500"
            style={{
              width: `${visibleBufferedPercent}%`,
            }}
          />

          {/* Played */}
          <div
            className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-red-600"
            style={{
              width: `${progressPercent}%`,
            }}
          />

          {/* Seek Input */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleProgressChange}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={() => setIsSeeking(true)}
            onTouchEnd={() => setIsSeeking(false)}
            aria-label="Video progress"
            className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent accent-red-600"
          />
        </div>

        {/* =================================================
            MAIN CONTROL ROW
        ================================================= */}

        <div className="flex items-center justify-between gap-2">
          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            {/* PLAY / PAUSE */}

            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              className="rounded-lg p-2 text-white transition hover:bg-white/15"
            >
              {isPlaying ? (
                <Pause size={21} fill="currentColor" />
              ) : (
                <Play size={21} fill="currentColor" />
              )}
            </button>

            {/* PREVIOUS */}

            <button
              type="button"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              title="Previous episode"
              className={`rounded-lg p-2 text-white transition ${
                hasPrevious
                  ? "hover:bg-white/15"
                  : "cursor-not-allowed opacity-30"
              }`}
            >
              <ChevronLeft size={21} />
            </button>

            {/* NEXT */}

            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              title="Next episode"
              className={`rounded-lg p-2 text-white transition ${
                hasNext ? "hover:bg-white/15" : "cursor-not-allowed opacity-30"
              }`}
            >
              <ChevronRight size={21} />
            </button>

            {/* REWIND 5 */}

            <button
              type="button"
              onClick={() => seekBy(-5)}
              title="Rewind 5 seconds"
              className="hidden rounded-lg p-2 text-white transition hover:bg-white/15 sm:block"
            >
              <RotateCcw size={20} />
            </button>

            {/* FORWARD 5 */}

            <button
              type="button"
              onClick={() => seekBy(5)}
              title="Forward 5 seconds"
              className="hidden rounded-lg p-2 text-white transition hover:bg-white/15 sm:block"
            >
              <RotateCw size={20} />
            </button>

            {/* =================================================
                VOLUME
            ================================================= */}

            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                className="rounded-lg p-2 text-white transition hover:bg-white/15"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden w-20 cursor-pointer accent-red-600 sm:block"
                aria-label="Volume"
              />
            </div>

            {/* =================================================
                TIME
            ================================================= */}

            <span className="ml-1 whitespace-nowrap text-xs text-white/90 sm:text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">
            {/* =================================================
                AUDIO
            ================================================= */}

            {audioTracks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowAudioMenu((prev) => !prev);

                  setShowSubtitleMenu(false);

                  setShowSettings(false);
                }}
                title="Audio language"
                className={`rounded-lg p-2 text-white transition hover:bg-white/15 ${
                  showAudioMenu ? "bg-white/15" : ""
                }`}
              >
                <Languages size={20} />
              </button>
            )}

            {/* =================================================
                SUBTITLE
            ================================================= */}

            {subtitleTracks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowSubtitleMenu((prev) => !prev);

                  setShowAudioMenu(false);

                  setShowSettings(false);
                }}
                title="Subtitles"
                className={`rounded-lg p-2 text-white transition hover:bg-white/15 ${
                  showSubtitleMenu ? "bg-white/15" : ""
                }`}
              >
                <Captions size={20} />
              </button>
            )}

            {/* =================================================
                SETTINGS
            ================================================= */}

            <button
              type="button"
              onClick={() => {
                setShowSettings((prev) => !prev);

                setShowAudioMenu(false);

                setShowSubtitleMenu(false);
              }}
              title="Settings"
              className={`rounded-lg p-2 text-white transition hover:bg-white/15 ${
                showSettings ? "bg-white/15" : ""
              }`}
            >
              <Settings size={20} />
            </button>

            {/* =================================================
                FULLSCREEN
            ================================================= */}

            <button
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen"
              className="rounded-lg p-2 text-white transition hover:bg-white/15"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* =================================================
                SETTINGS MENU
            ================================================= */}

            {showSettings && (
              <div className="absolute bottom-14 right-0 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#161616]/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Quality
                </div>

                {/* AUTO */}

                <button
                  type="button"
                  onClick={() => changeQuality(-1)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                    selectedQuality === -1
                      ? "bg-white/10 text-white"
                      : "text-white/80"
                  }`}
                >
                  <span>Auto</span>

                  {selectedQuality === -1 && (
                    <span className="text-xs text-red-400">✓</span>
                  )}
                </button>

                {/* QUALITY LIST */}

                {qualities.length > 0 ? (
                  qualities.map((quality) => (
                    <button
                      type="button"
                      key={quality.index}
                      onClick={() => changeQuality(quality.index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                        selectedQuality === quality.index
                          ? "bg-white/10 text-white"
                          : "text-white/80"
                      }`}
                    >
                      <span>{quality.height}p</span>

                      {selectedQuality === quality.index && (
                        <span className="text-xs text-red-400">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-white/40">
                    Quality levels unavailable
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                AUDIO MENU
            ================================================= */}

            {showAudioMenu && (
              <div className="absolute bottom-14 right-12 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#161616]/95 p-2 shadow-2xl backdrop-blur-xl sm:right-16">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Audio
                </div>

                {audioTracks.length > 0 ? (
                  audioTracks.map((track) => (
                    <button
                      key={track.index}
                      type="button"
                      onClick={() => changeAudioTrack(track.index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                        selectedAudioTrack === track.index
                          ? "bg-white/10 text-white"
                          : "text-white/80"
                      }`}
                    >
                      <span className="truncate">{track.name}</span>

                      {selectedAudioTrack === track.index && (
                        <span className="ml-2 text-xs text-red-400">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-white/40">
                    No audio tracks
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                SUBTITLE MENU
            ================================================= */}

            {showSubtitleMenu && (
              <div className="absolute bottom-14 right-0 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#161616]/95 p-2 shadow-2xl backdrop-blur-xl sm:right-16">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Subtitles
                </div>

                {/* OFF */}

                <button
                  type="button"
                  onClick={() => changeSubtitleTrack(-1)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                    selectedSubtitleTrack === -1
                      ? "bg-white/10 text-white"
                      : "text-white/80"
                  }`}
                >
                  <span>Off</span>

                  {selectedSubtitleTrack === -1 && (
                    <span className="text-xs text-red-400">✓</span>
                  )}
                </button>

                {/* SUBTITLE LIST */}

                {subtitleTracks.length > 0 ? (
                  subtitleTracks.map((track) => (
                    <button
                      key={track.index}
                      type="button"
                      onClick={() => changeSubtitleTrack(track.index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                        selectedSubtitleTrack === track.index
                          ? "bg-white/10 text-white"
                          : "text-white/80"
                      }`}
                    >
                      <span className="truncate">{track.name}</span>

                      {selectedSubtitleTrack === track.index && (
                        <span className="ml-2 text-xs text-red-400">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-white/40">
                    No subtitle tracks
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
