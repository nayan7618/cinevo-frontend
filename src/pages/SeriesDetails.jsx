import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Play,
  Star,
  Calendar,
  Globe,
  Layers,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Tv,
  MessageSquare,
  Send,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

// =========================================================
// PUBLIC EPISODE HELPERS
// =========================================================

const isPlayableEpisode = (episode) => {
  return episode?.video?.status === "READY";
};

const sortEpisodes = (episodeList) => {
  if (!Array.isArray(episodeList)) {
    return [];
  }

  return [...episodeList].sort(
    (a, b) => Number(a.episodeNumber || 0) - Number(b.episodeNumber || 0),
  );
};

const getPlayableEpisodes = (episodeList) => {
  return sortEpisodes(episodeList).filter(isPlayableEpisode);
};

const SeriesDetails = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  // =========================================================
  // MY LIST
  // =========================================================

  const [inMyList, setInMyList] = useState(false);
  const [myListLoading, setMyListLoading] = useState(true);
  const [myListSubmitting, setMyListSubmitting] = useState(false);
  const [myListError, setMyListError] = useState("");

  // =========================================================
  // RATINGS / REVIEWS
  // =========================================================

  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  // =========================================================
  // LOAD SERIES
  // =========================================================

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);

        console.log("🔵 SERIES ID:", seriesId);
        console.log("🔵 API:", `/api/series/${seriesId}`);

        const response = await api.get(`/series/${seriesId}`);

        console.log("🟢 SERIES RESPONSE:", response.data);

        if (!response.data?.success) {
          throw new Error("Series not found");
        }

        const seriesData = response.data.series;

        const sortedSeasons = [...(seriesData.seasons || [])].sort(
          (a, b) => Number(a.seasonNumber || 0) - Number(b.seasonNumber || 0),
        );

        setSeries({
          ...seriesData,
          seasons: sortedSeasons,
        });

        if (sortedSeasons.length > 0) {
          const firstSeason = sortedSeasons[0];

          setSelectedSeasonId(String(firstSeason.id));

          const initialEpisodes = Array.isArray(firstSeason.episodes)
            ? getPlayableEpisodes(firstSeason.episodes)
            : [];

          console.log("🎬 INITIAL PUBLIC PLAYABLE EPISODES:", initialEpisodes);

          setEpisodes(initialEpisodes);
        } else {
          setSelectedSeasonId(null);
          setEpisodes([]);
        }
      } catch (error) {
        console.error(
          "🔴 SERIES ERROR:",
          error.response?.data || error.message || error,
        );

        setError(error.response?.data?.message || "Failed to load series");
      } finally {
        console.log("🟡 SERIES FETCH FINISHED");

        setLoading(false);
      }
    };

    if (seriesId) {
      fetchSeries();
    }
  }, [seriesId]);

  // =========================================================
  // CHECK MY LIST
  // =========================================================

  useEffect(() => {
    const checkMyList = async () => {
      if (!seriesId) return;

      try {
        setMyListLoading(true);
        setMyListError("");

        const response = await api.get(`/my-list/check/SERIES/${seriesId}`);

        setInMyList(Boolean(response.data?.inMyList));
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("My List check error:", error);

          setMyListError(
            error.response?.data?.message || "Unable to check My List",
          );
        }

        setInMyList(false);
      } finally {
        setMyListLoading(false);
      }
    };

    checkMyList();
  }, [seriesId]);

  // =========================================================
  // LOAD EPISODES FOR SELECTED SEASON
  // =========================================================

  useEffect(() => {
    if (!selectedSeasonId || !series?.seasons) {
      return;
    }

    const selected = series.seasons.find(
      (season) => String(season.id) === String(selectedSeasonId),
    );

    // getSeriesById already includes season episodes.
    if (selected && Array.isArray(selected.episodes)) {
      const list = getPlayableEpisodes(selected.episodes);

      console.log("🎬 SELECTED SEASON PLAYABLE EPISODES:", list);

      setEpisodes(list);
      setEpisodesLoading(false);

      return;
    }

    let cancelled = false;

    const fetchEpisodes = async () => {
      try {
        setEpisodesLoading(true);

        const response = await api.get(`/episodes/season/${selectedSeasonId}`);

        const data =
          response.data?.episodes ||
          response.data?.data?.episodes ||
          response.data?.data ||
          [];

        const list = Array.isArray(data) ? getPlayableEpisodes(data) : [];

        console.log("🎬 FETCHED PUBLIC PLAYABLE EPISODES:", list);

        if (!cancelled) {
          setEpisodes(list);
        }
      } catch (err) {
        console.error("Episodes fetch error:", err);

        if (!cancelled) {
          setEpisodes([]);
        }
      } finally {
        if (!cancelled) {
          setEpisodesLoading(false);
        }
      }
    };

    fetchEpisodes();

    return () => {
      cancelled = true;
    };
  }, [selectedSeasonId, series]);

  // =========================================================
  // LOAD WATCH HISTORY
  // =========================================================

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        setHistoryLoading(true);

        const response = await api.get("/watch-history", {
          withCredentials: true,
        });

        if (Array.isArray(response.data?.continueWatching)) {
          setWatchHistory(response.data.continueWatching);
        } else {
          setWatchHistory([]);
        }
      } catch (err) {
        console.log("Watch history unavailable:", err);

        setWatchHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchWatchHistory();
  }, []);

  // =========================================================
  // LOAD RATINGS / REVIEWS
  // =========================================================

  useEffect(() => {
    const fetchRatings = async () => {
      if (!seriesId) return;

      try {
        setRatingsLoading(true);
        setRatingError("");

        const response = await api.get(
          `/series-ratings/${seriesId}?page=1&limit=20`,
        );

        const data = response.data;

        setRatings(Array.isArray(data?.ratings) ? data.ratings : []);

        if (data?.rating?.average !== undefined) {
          setSeries((prev) =>
            prev
              ? {
                  ...prev,
                  rating: {
                    average: Number(data.rating.average) || 0,

                    total: Number(data.rating.total) || 0,
                  },
                }
              : prev,
          );
        }
      } catch (err) {
        console.error("Ratings fetch error:", err);

        setRatingError(
          err?.response?.data?.message || "Failed to load ratings.",
        );
      } finally {
        setRatingsLoading(false);
      }
    };

    fetchRatings();
  }, [seriesId]);

  // =========================================================
  // CURRENT SEASON
  // =========================================================

  const selectedSeason = useMemo(() => {
    if (!series?.seasons || !selectedSeasonId) {
      return null;
    }

    return (
      series.seasons.find(
        (season) => String(season.id) === String(selectedSeasonId),
      ) || null
    );
  }, [series, selectedSeasonId]);

  // =========================================================
  // SERIES RATING
  // =========================================================

  const averageRating = Number(series?.rating?.average || 0);

  const totalRatings = Number(series?.rating?.total || 0);

  // =========================================================
  // SERIES GENRES
  // =========================================================

  const genres = useMemo(() => {
    if (!Array.isArray(series?.genres)) {
      return [];
    }

    return series.genres.map((item) => item?.genre?.name).filter(Boolean);
  }, [series]);

  // =========================================================
  // WATCH HISTORY MAP
  // =========================================================

  const historyMap = useMemo(() => {
    const map = {};

    if (!Array.isArray(watchHistory)) {
      return map;
    }

    watchHistory.forEach((item) => {
      const episodeId = item?.content?.id;

      if (episodeId) {
        map[episodeId] = item;
      }
    });

    return map;
  }, [watchHistory]);

  // =========================================================
  // TOGGLE MY LIST
  // =========================================================

  const handleToggleMyList = async () => {
    if (!seriesId || myListSubmitting) {
      return;
    }

    try {
      setMyListSubmitting(true);
      setMyListError("");

      if (inMyList) {
        const response = await api.delete(`/my-list/SERIES/${seriesId}`);

        if (!response.data?.success) {
          throw new Error("Failed to remove series from My List");
        }

        setInMyList(false);
      } else {
        const response = await api.post(
          "/my-list",
          {
            type: "SERIES",
            contentId: seriesId,
          }
        );

        if (!response.data?.success) {
          throw new Error("Failed to add series to My List");
        }

        setInMyList(true);
      }
    } catch (error) {
      console.error("Toggle My List error:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setMyListError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update My List",
      );
    } finally {
      setMyListSubmitting(false);
    }
  };

  // =========================================================
  // SUBMIT RATING / REVIEW
  // =========================================================

  const submitRating = async (event) => {
    event.preventDefault();

    if (!selectedRating) {
      setRatingMessage("Please select a rating from 1 to 5.");

      return;
    }

    try {
      setRatingSubmitting(true);
      setRatingMessage("");
      setRatingError("");

      const response = await api.post(`/series-ratings/${seriesId}`, {
        rating: selectedRating,
        review: reviewText.trim() || undefined,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to save rating.");
      }

      setRatingMessage("Your rating and review were saved.");

      setReviewText("");

      const ratingsResponse = await api.get(
        `/series-ratings/${seriesId}?page=1&limit=20`,
      );

      const ratingsData = ratingsResponse.data;

      setRatings(
        Array.isArray(ratingsData?.ratings) ? ratingsData.ratings : [],
      );

      if (ratingsData?.rating) {
        setSeries((prev) =>
          prev
            ? {
                ...prev,
                rating: {
                  average: Number(ratingsData.rating.average) || 0,

                  total: Number(ratingsData.rating.total) || 0,
                },
              }
            : prev,
        );
      }
    } catch (err) {
      console.error("Rating submit error:", err);

      setRatingMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save rating.",
      );
    } finally {
      setRatingSubmitting(false);
    }
  };

  // =========================================================
  // REVIEW DATE
  // =========================================================

  const formatReviewDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // EPISODE PROGRESS
  // =========================================================

  const getEpisodeProgress = (episode) => {
    const history = historyMap[episode.id];

    if (!history) {
      return {
        progress: 0,
        completed: false,
      };
    }

    const progressSeconds = Number(history.progressSeconds || 0);

    const duration = Number(history.duration || episode.duration || 0);

    let progress = 0;

    if (duration > 0) {
      progress = (progressSeconds / duration) * 100;
    }

    return {
      progress: Math.min(100, Math.max(0, progress)),

      completed: Boolean(history.completed),
    };
  };

  // =========================================================
  // FORMAT DURATION
  // =========================================================

  const formatDuration = (seconds) => {
    const totalSeconds = Number(seconds || 0);

    if (!totalSeconds || totalSeconds < 1) {
      return null;
    }

    const minutes = Math.floor(totalSeconds / 60);

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }

    return `${minutes}m`;
  };

  // =========================================================
  // OPEN EPISODE
  // =========================================================

  const openEpisode = (episode) => {
    if (!episode?.id) {
      return;
    }

    if (!isPlayableEpisode(episode)) {
      console.log("⚠️ Blocked non-playable episode:", episode);

      return;
    }

    navigate(`/series/${seriesId}/episode/${episode.id}`);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <Sidebar />

        <div className="lg:ml-64">
          <Topbar />

          <div className="flex min-h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-white" />

              <p className="text-sm text-gray-400">Loading series...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !series) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <Sidebar />

        <div className="lg:ml-64">
          <Topbar />

          <div className="flex min-h-[80vh] items-center justify-center px-6">
            <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />

              <h2 className="text-xl font-semibold">Series unavailable</h2>

              <p className="mt-2 text-sm text-gray-400">
                {error || "Series could not be found."}
              </p>

              <button
                onClick={() => navigate("/series")}
                className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
              >
                Back to Series
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // SEASONS
  // =========================================================

  const seasons = [...(series.seasons || [])].sort(
    (a, b) => Number(a.seasonNumber || 0) - Number(b.seasonNumber || 0),
  );

  // Count only public playable episodes.
  const totalEpisodeCount = seasons.reduce(
    (total, season) =>
      total +
      (Array.isArray(season.episodes)
        ? getPlayableEpisodes(season.episodes).length
        : 0),

    0,
  );

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <Sidebar />

      <div className="lg:ml-64">
        <Topbar />

        <main>
          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="relative min-h-[520px] overflow-hidden">
            {/* BACKDROP */}

            <div className="absolute inset-0">
              {series.backdropUrl ? (
                <img
                  src={series.backdropUrl}
                  alt={series.title}
                  className="h-full w-full object-cover"
                />
              ) : series.posterUrl ? (
                <img
                  src={series.posterUrl}
                  alt={series.title}
                  className="h-full w-full object-cover blur-sm"
                />
              ) : (
                <div className="h-full w-full bg-[#16161d]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/80 to-transparent" />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-black/30" />
            </div>

            {/* HERO CONTENT */}

            <div className="relative mx-auto flex max-w-7xl items-end px-4 py-12 sm:px-6 lg:px-8">
              <div className="flex w-full flex-col gap-8 md:flex-row md:items-end">
                {/* POSTER */}

                <div className="hidden w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl md:block">
                  {series.posterUrl ? (
                    <img
                      src={series.posterUrl}
                      alt={series.title}
                      className="aspect-[2/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] items-center justify-center bg-[#16161d]">
                      <Tv className="h-14 w-14 text-gray-700" />
                    </div>
                  )}
                </div>

                {/* DETAILS */}

                <div className="max-w-3xl pb-2">
                  <button
                    onClick={() => navigate("/series")}
                    className="mb-5 flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Series
                  </button>

                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    {series.title}
                  </h1>

                  {/* META */}

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    {series.releaseYear && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />

                        {series.releaseYear}
                      </span>
                    )}

                    {series.language && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-4 w-4" />

                        {series.language}
                      </span>
                    )}

                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      {series.totalSeasons || seasons.length} Seasons
                    </span>

                    <span>
                      {totalEpisodeCount || series.totalEpisodes || 0} Episodes
                    </span>

                    {series.ageRating && (
                      <span className="rounded-md border border-white/20 px-2 py-0.5">
                        {series.ageRating}
                      </span>
                    )}
                  </div>

                  {/* RATING */}

                  <div className="mt-4 flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />

                    <span className="font-semibold">
                      {averageRating.toFixed(1)}
                    </span>

                    <span className="text-sm text-gray-400">
                      ({totalRatings}{" "}
                      {totalRatings === 1 ? "rating" : "ratings"})
                    </span>
                  </div>

                  {/* GENRES */}

                  {genres.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* DESCRIPTION */}

                  {series.description && (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                      {series.description}
                    </p>
                  )}
                </div>

                {/* ACTIONS */}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleMyList}
                    disabled={myListLoading || myListSubmitting}
                    className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      inMyList
                        ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/15"
                        : "border-white/10 bg-white/[0.05] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {myListSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : inMyList ? (
                      <BookmarkCheck size={18} />
                    ) : (
                      <Bookmark size={18} />
                    )}

                    {myListLoading
                      ? "Checking..."
                      : myListSubmitting
                        ? "Updating..."
                        : inMyList
                          ? "In My List"
                          : "Add to My List"}
                  </button>

                  {myListError && (
                    <p className="w-full text-xs text-red-400">{myListError}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              EPISODES
          ===================================================== */}

          <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
            {/* SECTION HEADER */}

            <div className="mb-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div>
                <h2 className="text-2xl font-bold">Episodes</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select a season and start watching.
                </p>
              </div>

              {/* SEASON SELECTOR */}

              {seasons.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSeasonId || ""}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    className="appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-4 pr-11 text-sm font-medium text-white outline-none focus:border-white/20"
                  >
                    {seasons.map((season) => (
                      <option
                        key={season.id}
                        value={season.id}
                        className="bg-[#16161d]"
                      >
                        Season {season.seasonNumber}
                        {season.title ? ` - ${season.title}` : ""}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              )}
            </div>

            {/* CURRENT SEASON */}

            {selectedSeason && (
              <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <Layers className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Season {selectedSeason.seasonNumber}
                    </p>

                    <p className="text-xs text-gray-500">
                      {selectedSeason.title ||
                        `${episodes.length} episodes available`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EPISODE LOADING */}

            {episodesLoading ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading episodes...
                </div>
              </div>
            ) : episodes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <Tv className="mx-auto mb-4 h-10 w-10 text-gray-600" />

                <h3 className="text-lg font-semibold">No episodes available</h3>

                <p className="mt-2 text-sm text-gray-500">
                  This season does not have any playable episodes yet.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-3">
                {episodes.map((episode) => {
                  const episodeHistory = getEpisodeProgress(episode);

                  const duration = formatDuration(episode.duration);

                  const isReady = isPlayableEpisode(episode);

                  return (
                    <article
                      key={episode.id}
                      className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition hover:border-white/10 hover:bg-white/[0.05]"
                    >
                      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:p-4">
                        {/* THUMBNAIL */}

                        <div
                          onClick={() => isReady && openEpisode(episode)}
                          className={`relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-[#15151c] sm:w-56 ${
                            isReady ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          {episode.thumbnailUrl ? (
                            <img
                              src={episode.thumbnailUrl}
                              alt={episode.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : episode.video?.thumbnailUrl ? (
                            <img
                              src={episode.video.thumbnailUrl}
                              alt={episode.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Tv className="h-10 w-10 text-gray-700" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/20" />

                          {isReady && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                                <Play className="ml-0.5 h-5 w-5 fill-current" />
                              </div>
                            </div>
                          )}

                          {episodeHistory.progress > 0 &&
                            !episodeHistory.completed && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div
                                  className="h-full bg-white"
                                  style={{
                                    width: `${episodeHistory.progress}%`,
                                  }}
                                />
                              </div>
                            )}
                        </div>

                        {/* INFO */}

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Episode {episode.episodeNumber}
                              </span>

                              {episodeHistory.completed && (
                                <span className="flex items-center gap-1 text-xs text-green-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Watched
                                </span>
                              )}

                              {isReady && (
                                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                                  READY
                                </span>
                              )}
                            </div>

                            <h3 className="mt-1 line-clamp-2 text-lg font-semibold">
                              {episode.title ||
                                `Episode ${episode.episodeNumber}`}
                            </h3>

                            {episode.description && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                                {episode.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {duration && (
                                <span className="flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5" />

                                  {duration}
                                </span>
                              )}

                              {episodeHistory.progress > 0 &&
                                !episodeHistory.completed && (
                                  <span>
                                    {Math.round(episodeHistory.progress)}%
                                    watched
                                  </span>
                                )}
                            </div>

                            <button
                              onClick={() => openEpisode(episode)}
                              disabled={!isReady}
                              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                isReady
                                  ? "bg-white text-black hover:bg-gray-200"
                                  : "cursor-not-allowed bg-white/5 text-gray-600"
                              }`}
                            >
                              <Play className="h-4 w-4 fill-current" />

                              {episodeHistory.progress > 0 &&
                              !episodeHistory.completed
                                ? "Continue"
                                : "Watch"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              RATINGS & REVIEWS
          ===================================================== */}

          <section className="mx-auto max-w-7xl border-t border-white/5 px-4 pt-12 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              {/* RATE */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <MessageSquare className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">Rate this series</h2>

                    <p className="text-xs text-gray-500">
                      Share your rating and review.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitRating} className="mt-5">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedRating(value)}
                        aria-label={`Rate ${value} out of 5`}
                        className="rounded-md p-1 transition hover:scale-105"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            value <= selectedRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write a review..."
                    maxLength={1000}
                    rows={5}
                    className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/20"
                  />

                  {ratingMessage && (
                    <p className="mt-3 text-xs text-gray-400">
                      {ratingMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={ratingSubmitting || !selectedRating}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {ratingSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}

                    {ratingSubmitting ? "Saving..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* REVIEWS */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Ratings & Reviews</h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />

                    <span className="text-lg font-bold">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {ratingsLoading ? (
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading reviews...
                  </div>
                ) : ratingError ? (
                  <p className="mt-6 text-sm text-gray-500">{ratingError}</p>
                ) : ratings.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-gray-700" />

                    <p className="text-sm text-gray-500">
                      No reviews yet. Be the first to review this series.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
                    {ratings.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              User
                            </p>

                            <p className="text-[11px] text-gray-600">
                              {formatReviewDate(item.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

                            <span className="text-xs font-semibold">
                              {Number(item.rating) || 0}
                            </span>
                          </div>
                        </div>

                        {item.review && (
                          <p className="mt-3 text-sm leading-6 text-gray-400">
                            {item.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SeriesDetails;
