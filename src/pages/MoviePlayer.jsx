import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdManager from "@/components/AdManager";
import useVideoAds from "@/hooks/useVideoAds";
import api from "../services/api"
import { ArrowLeft, AlertCircle, Play, Loader2 } from "lucide-react";

import VideoPlayer from "@/components/VideoPlayer";
import HilltopPlayerBanner from "@/components/ads/HilltopPlayerBanner";

const MoviePlayer = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [movie, setMovie] = useState(null);
  const [video, setVideo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [resumeTime, setResumeTime] = useState(0);

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

  // =====================================================
  // SITE AD SETTINGS
  // =====================================================

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
  const isSavingProgressRef = useRef(false);

  const midRollResumeTimeRef = useRef(0);

  // -----------------------------------------------------
  // View tracking
  // -----------------------------------------------------

  // Prevent duplicate view requests for the same movie session
  const viewRecordedRef = useRef(false);

  // =====================================================
  // FETCH MOVIE + PLAYBACK
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    // Reset view state whenever movie changes
    viewRecordedRef.current = false;

    const fetchMoviePlayerData = async () => {
      if (!movieId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        // -------------------------------------------------
        // Fetch movie details + authenticated playback
        // -------------------------------------------------

        const [movieResponse, playbackResponse, settingsResponse] =
          await Promise.all([
            api.get(`/movies/${movieId}`),

            api.get(`/watch-history/movie/${movieId}`, {
              withCredentials: true,
            }),

            api.get("/settings/public").catch(() => ({
              data: {
                success: false,
                settings: {},
              },
            })),
          ]);

        console.log("🎬 Movie API:", movieResponse.data);
        console.log("▶️ Playback API:", playbackResponse.data);

        // -------------------------------------------------
        // Site ad settings
        // -------------------------------------------------

        const publicSettings = settingsResponse.data?.settings || {};

        const nextAdSettings = {
          adsEnabled: publicSettings.adsEnabled !== false,

          preRollEnabled: publicSettings.preRollEnabled !== false,

          midRollEnabled: publicSettings.midRollEnabled !== false,

          postRollEnabled: publicSettings.postRollEnabled !== false,
        };

        if (!movieResponse.data?.success) {
          throw new Error(
            movieResponse.data?.message || "Failed to load movie",
          );
        }

        if (!playbackResponse.data?.success) {
          throw new Error(
            playbackResponse.data?.message || "Failed to load playback",
          );
        }

        if (!isMounted) {
          return;
        }

        // -------------------------------------------------
        // Movie
        // -------------------------------------------------

        const movieData = movieResponse.data.movie;

        setMovie(movieData);

        // -------------------------------------------------
        // Playback
        // -------------------------------------------------

        const playback = playbackResponse.data.playback;

        const playbackVideo = playback?.video;

        if (!playbackVideo?.hlsUrl) {
          throw new Error("Movie video is not ready");
        }

        setVideo(playbackVideo);

        setSiteAdSettings(nextAdSettings);

        resetAds();

        // -------------------------------------------------
        // PRE-ROLL
        // -------------------------------------------------

        if (
          nextAdSettings.adsEnabled &&
          nextAdSettings.preRollEnabled &&
          shouldShowPreRoll()
        ) {
          markPreRollShown();

          console.log("📺 STARTING MOVIE PRE-ROLL AD");

          startAd("preRoll");
        } else {
          setStartVideoAfterAd(true);
        }

        // -------------------------------------------------
        // Resume position
        // -------------------------------------------------

        const progress = Number(playback?.progressSeconds) || 0;

        const completed = Boolean(playback?.completed);

        // Completed movie → start from beginning
        const safeResume = completed ? 0 : Math.max(progress, 0);

        setResumeTime(safeResume);

        // Prevent immediate unnecessary save
        lastSavedProgressRef.current = safeResume;

        console.log("⏩ Resume position:", safeResume);

        console.log("✅ Movie completed:", completed);
      } catch (error) {
        console.error("❌ Movie Player Error:", error);

        if (!isMounted) {
          return;
        }

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load movie",
        );

        setResumeTime(0);
        setMovie(null);
        setVideo(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMoviePlayerData();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  // =====================================================
  // CREATE VIEW EVENT
  // =====================================================

  const createViewEvent = async () => {
    if (!movieId) {
      return;
    }

    // Already recorded for this movie session
    if (viewRecordedRef.current) {
      return;
    }

    try {
      console.log("👁️ Creating movie view event:", {
        movieId,
      });

      const response = await api.post(
        "/views",
        {
          movieId,
          watchedSeconds: 10,
        },
        {
          withCredentials: true,
        },
      );

      if (response.data?.success) {
        viewRecordedRef.current = true;

        console.log("✅ Movie view recorded:", {
          movieId,
          viewEvent: response.data.viewEvent,
        });
      } else {
        console.warn(
          "⚠️ View event response was not successful:",
          response.data,
        );
      }
    } catch (error) {
      console.error(
        "❌ Movie view event error:",
        error.response?.data || error.message,
      );
    }
  };

  // =====================================================
  // MID-ROLL CHECK
  // =====================================================

  const handleMidRollCheck = (currentTime) => {
    if (isAdPlaying) {
      return;
    }

    const numericCurrentTime = Number(currentTime) || 0;

    // -------------------------------------------------
    // Create view after user has watched 10 seconds
    // -------------------------------------------------

    if (numericCurrentTime >= 10) {
      createViewEvent();
    }

    // -------------------------------------------------
    // GLOBAL AD SETTINGS
    // -------------------------------------------------

    if (!siteAdSettings.adsEnabled || !siteAdSettings.midRollEnabled) {
      return;
    }

    // -------------------------------------------------
    // Mid-roll logic
    // -------------------------------------------------

    if (!shouldShowMidRoll(numericCurrentTime)) {
      return;
    }

    const videoElement = document.querySelector("video");

    if (!videoElement) {
      return;
    }

    const resumeTime = videoElement.currentTime || 0;

    midRollResumeTimeRef.current = resumeTime;

    videoElement.pause();

    markMidRollShown(resumeTime);

    console.log("📺 Starting mid-roll at:", resumeTime);

    startAd("midRoll");
  };

  // =====================================================
  // SAVE WATCH HISTORY
  // =====================================================

  const saveProgress = async (currentTime, duration, force = false) => {
    if (!movieId) {
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

    const clampedTime = Math.min(
      Math.max(numericCurrentTime, 0),
      numericDuration,
    );

    const completed = clampedTime >= numericDuration * 0.9;

    // -------------------------------------------------
    // Avoid unnecessary API calls
    // -------------------------------------------------

    if (
      !force &&
      clampedTime - lastSavedProgressRef.current < 10 &&
      clampedTime < numericDuration
    ) {
      return;
    }

    // -------------------------------------------------
    // Prevent overlapping requests
    // -------------------------------------------------

    if (isSavingProgressRef.current) {
      return;
    }

    try {
      isSavingProgressRef.current = true;

      await api.post(
        "/watch-history",
        {
          movieId,

          progressSeconds: Math.floor(clampedTime),

          duration: Math.floor(numericDuration),

          completed,
        },
        {
          withCredentials: true,
        },
      );

      lastSavedProgressRef.current = clampedTime;

      console.log(
        "💾 Movie progress saved:",
        Math.floor(clampedTime),
        "/",
        Math.floor(numericDuration),
      );
    } catch (error) {
      console.error(
        "❌ Movie progress save error:",
        error.response?.data || error.message,
      );
    } finally {
      isSavingProgressRef.current = false;
    }
  };

  // =====================================================
  // SAVE BEFORE PAGE UNMOUNT
  // =====================================================

  useEffect(() => {
    return () => {
      const videoElement = document.querySelector("video");

      if (
        videoElement &&
        Number.isFinite(videoElement.duration) &&
        videoElement.duration > 0
      ) {
        const currentTime = videoElement.currentTime;

        const duration = videoElement.duration;

        // Best effort before leaving page
        saveProgress(currentTime, duration, true);
      }
    };
  }, [movieId]);

  // =====================================================
  // AD COMPLETE
  // =====================================================

  const handleAdComplete = () => {
    const currentAdType = adType;

    // =====================================================
    // END CURRENT AD
    // =====================================================

    endAd();

    // =====================================================
    // PRE-ROLL
    // =====================================================

    if (currentAdType === "preRoll") {
      console.log("✅ Pre-roll completed");

      setStartVideoAfterAd(true);

      return;
    }

    // =====================================================
    // MID-ROLL
    // =====================================================

    if (currentAdType === "midRoll") {
      const videoElement = document.querySelector("video");

      if (!videoElement) {
        console.warn("⚠️ Video element not found after mid-roll");

        return;
      }

      const resumeTime = midRollResumeTimeRef.current || 0;

      try {
        if (
          Number.isFinite(resumeTime) &&
          Number.isFinite(videoElement.duration)
        ) {
          const safeResumeTime = Math.min(
            resumeTime,
            Math.max(videoElement.duration - 0.5, 0),
          );

          videoElement.currentTime = safeResumeTime;
        }

        console.log(
          "▶️ Resuming movie after mid-roll:",
          videoElement.currentTime,
        );

        videoElement.play().catch((err) => {
          console.warn("⚠️ Resume after mid-roll failed:", err);
        });
      } catch (err) {
        console.warn("⚠️ Mid-roll resume failed:", err);
      }

      return;
    }

    // =====================================================
    // POST-ROLL
    // =====================================================

    if (currentAdType === "postRoll") {
      console.log("✅ Post-roll completed");

      return;
    }
  };

  // =====================================================
  // AD SKIP
  // =====================================================

  const handleAdSkip = () => {
    handleAdComplete();
  };

  // =====================================================
  // VIDEO ENDED
  // =====================================================

  const handleVideoEnded = async () => {
    console.log("🎬 VIDEO ENDED");

    // Make sure view exists even if somehow
    // user reaches the end very quickly
    if (!viewRecordedRef.current) {
      await createViewEvent();
    }

    const videoElement = document.querySelector("video");

    if (!videoElement) {
      console.warn("⚠️ Video element not found on ended");

      return;
    }

    const duration = Number(videoElement.duration);

    console.log("⏱️ Final duration:", duration);

    if (!Number.isFinite(duration) || duration <= 0) {
      console.warn("⚠️ Invalid duration:", duration);

      return;
    }

    // -------------------------------------------------
    // Save completed progress
    // -------------------------------------------------

    await saveProgress(duration, duration, true);

    console.log("✅ Movie completed, checking post-roll...");

    const showPostRoll =
      siteAdSettings.adsEnabled &&
      siteAdSettings.postRollEnabled &&
      shouldShowPostRoll();

    console.log("📺 Should show post-roll:", showPostRoll);

    if (!showPostRoll) {
      console.log("ℹ️ Post-roll already shown or disabled");

      return;
    }

    markPostRollShown();

    console.log("📺 STARTING POST-ROLL AD");

    // Ensure content is stopped
    videoElement.pause();

    startAd("postRoll");
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = async () => {
    const videoElement = document.querySelector("video");

    if (
      videoElement &&
      Number.isFinite(videoElement.duration) &&
      videoElement.duration > 0
    ) {
      await saveProgress(videoElement.currentTime, videoElement.duration, true);
    }

    navigate(`/movie/${movieId}`);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-white">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto mb-4 animate-spin text-red-500"
          />

          <p className="text-sm text-zinc-500">Loading movie...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle size={26} className="text-red-500" />
          </div>

          <h2 className="text-lg font-semibold">Unable to load movie</h2>

          <p className="mt-2 text-sm text-zinc-500">{error}</p>

          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <ArrowLeft size={17} />
            Back to Movie
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MOVIE NOT FOUND
  // =====================================================

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-white">
        <div className="text-center">
          <p className="text-sm text-zinc-500">Movie not found.</p>

          <button
            type="button"
            onClick={() => navigate("/home")}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // VIDEO URL
  // =====================================================

  const videoUrl = video?.hlsUrl || null;

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08080c]/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10"
            aria-label="Back to movie"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Movie</p>

            <h1 className="truncate text-sm font-semibold sm:text-base">
              {movie.title}
            </h1>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            VIDEO PLAYER
        ================================================= */}

        <section>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
            {isAdPlaying && (
              <AdManager
                adType={adType}
                duration={15}
                skipAfter={10}
                onComplete={handleAdComplete}
                onSkip={handleAdSkip}
              />
            )}

            {videoUrl ? (
              <VideoPlayer
                src={videoUrl}
                poster={movie.backdropUrl || movie.posterUrl}
                title={movie.title}
                resumeTime={resumeTime}
                autoPlay={startVideoAfterAd}
                onProgress={saveProgress}
                onTimeUpdate={handleMidRollCheck}
                onEnded={handleVideoEnded}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Play size={28} className="ml-1 text-zinc-500" />
                </div>

                <p className="text-sm font-semibold text-zinc-400">
                  Video not available
                </p>

                <p className="mt-2 text-xs text-zinc-600">
                  The movie video is currently unavailable.
                </p>
              </div>
            )}
          </div>
        </section>
        {/* =================================================
    MOVIE INFO + HILLTOP BANNER
================================================= */}

        <section className="mt-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            {/* =========================
        MOVIE INFO
    ========================= */}

            <div>
              <p className="text-sm font-medium text-red-500">
                {movie.releaseYear}
                {movie.language ? ` • ${movie.language}` : ""}
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {movie.title}
              </h2>

              {/* META */}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {movie.duration && <span>{movie.duration} min</span>}

                {movie.ageRating && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />

                    <span>{movie.ageRating}</span>
                  </>
                )}

                {video?.quality && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-zinc-700" />

                    <span className="rounded bg-white/5 px-2 py-1">
                      {video.quality}
                    </span>
                  </>
                )}
              </div>

              {/* DESCRIPTION */}

              {movie.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">
                  {movie.description}
                </p>
              )}
            </div>

            {/* =========================
        HILLTOP BANNER
    ========================= */}

            <div className="flex justify-end lg:justify-end">
              <HilltopPlayerBanner
                zoneId="YOUR_MOVIE_PLAYER_ZONE_ID"
                adCode=""
              />
            </div>
          </div>
        </section>

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={handleBack}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          <ArrowLeft size={17} />
          Back to Movie
        </button>
      </main>
    </div>
  );
};

export default MoviePlayer;
