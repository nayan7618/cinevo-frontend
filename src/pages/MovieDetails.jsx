import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

import {
  ArrowLeft,
  Play,
  Clock3,
  Calendar,
  Languages,
  ShieldCheck,
  Loader2,
  Star,
  Send,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const MovieDetails = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  // =========================================================
  // MOVIE STATE
  // =========================================================

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  //mylist state
  const [inMyList, setInMyList] = useState(false);
  const [myListLoading, setMyListLoading] = useState(true);
  const [myListSubmitting, setMyListSubmitting] = useState(false);
  const [myListError, setMyListError] = useState("");
  // =========================================================
  // RATING STATE
  // =========================================================

  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState([]);

  const [ratings, setRatings] = useState([]);
  const [myRating, setMyRating] = useState(null);

  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState("");

  const [editingRating, setEditingRating] = useState(false);

  const [ratingLoading, setRatingLoading] = useState(true);
  const [ratingError, setRatingError] = useState("");

  const [submittingRating, setSubmittingRating] = useState(false);
  const [deletingRating, setDeletingRating] = useState(false);

  // =========================================================
  // REVIEWS PAGINATION
  // =========================================================

  const [ratingPage, setRatingPage] = useState(1);

  const [ratingPagination, setRatingPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // =========================================================
  // FETCH MOVIE
  // =========================================================

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/movies/${movieId}`);

        console.log("Movie Details:", response.data);

        if (!response.data?.success) {
          throw new Error("Movie not found");
        }

        setMovie(response.data.movie);
      } catch (error) {
        console.error("Movie details error:", error);

        setError(error.response?.data?.message || "Failed to load movie");
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);
  // mylist
  useEffect(() => {
    const checkMyList = async () => {
      if (!movieId) return;

      try {
        setMyListLoading(true);
        setMyListError("");

        const response = await api.get(`/my-list/check/MOVIE/${movieId}`);

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
  }, [movieId]);
  // =========================================================
  // FETCH MOVIE RATINGS
  // =========================================================

  const fetchMovieRatings = async (page = 1) => {
    if (!movieId) return;

    try {
      setRatingLoading(true);
      setRatingError("");

      const response = await api.get(`/movie-ratings/${movieId}`, {
        params: {
          page,
          limit: 10,
        },
      });

      console.log("Movie Ratings:", response.data);

      if (!response.data?.success) {
        throw new Error("Failed to load movie ratings");
      }

      const data = response.data;

      // Average rating
      setAverageRating(Number(data.rating?.average || 0));

      // Total ratings
      setRatingCount(Number(data.rating?.total || 0));

      // Rating distribution
      setRatingDistribution(data.rating?.distribution || []);

      // Reviews
      setRatings(data.ratings || []);

      // Current user's rating
      setMyRating(data.myRating || null);

      // Pagination
      setRatingPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      );

      setRatingPage(page);
    } catch (error) {
      console.error("Movie ratings error:", error);

      setRatingError(error.response?.data?.message || "Failed to load ratings");
    } finally {
      setRatingLoading(false);
    }
  };

  // =========================================================
  // INITIAL RATINGS LOAD
  // =========================================================

  useEffect(() => {
    if (movieId) {
      fetchMovieRatings(1);
    }
  }, [movieId]);

  // =========================================================
  // SYNC CURRENT USER RATING
  // =========================================================

  useEffect(() => {
    if (myRating && !editingRating) {
      setSelectedRating(myRating.rating || 0);

      setReview(myRating.review || "");
    }

    if (!myRating && !editingRating) {
      setSelectedRating(0);
      setReview("");
    }
  }, [myRating, editingRating]);

  // =========================================================
  // WATCH NOW
  // =========================================================

  const handleWatchNow = () => {
    if (!movie) return;

    const readyVideo = movie.videos?.find((video) => video.status === "READY");

    if (!readyVideo) {
      alert("Video is not available right now.");
      return;
    }

    navigate(`/watch/movie/${movie.id}`);
  };
  //mylist
  const handleToggleMyList = async () => {
    if (!movieId || myListSubmitting) return;

    try {
      setMyListSubmitting(true);
      setMyListError("");

      if (inMyList) {
        const response = await api.delete(`/my-list/MOVIE/${movieId}`);

        if (!response.data?.success) {
          throw new Error("Failed to remove movie from My List");
        }

        setInMyList(false);
      } else {
        const response = await api.post("/my-list", {
          type: "MOVIE",
          contentId: movieId,
        });

        if (!response.data?.success) {
          throw new Error("Failed to add movie to My List");
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
  // SUBMIT / UPDATE RATING
  // =========================================================

  const handleSubmitRating = async () => {
    if (!movieId) return;

    if (!selectedRating) {
      setRatingError("Please select a rating.");

      return;
    }

    try {
      setSubmittingRating(true);
      setRatingError("");

      const response = await api.post(`/movie-ratings/${movieId}`, {
        rating: selectedRating,
        review: review.trim() || null,
      });

      console.log("Rating saved:", response.data);

      if (!response.data?.success) {
        throw new Error("Failed to save rating");
      }

      // Update summary immediately
      if (response.data.stats) {
        setAverageRating(Number(response.data.stats.averageRating || 0));

        setRatingCount(Number(response.data.stats.ratingCount || 0));
      }

      setEditingRating(false);

      // Refresh rating data
      await fetchMovieRatings(1);
    } catch (error) {
      console.error("Submit rating error:", error);

      setRatingError(error.response?.data?.message || "Failed to save rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  // =========================================================
  // START EDIT
  // =========================================================

  const handleEditRating = () => {
    if (!myRating) return;

    setSelectedRating(myRating.rating || 0);

    setReview(myRating.review || "");

    setEditingRating(true);
    setRatingError("");

    setTimeout(() => {
      document.getElementById("movie-rating-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    setEditingRating(false);
    setRatingError("");

    if (myRating) {
      setSelectedRating(myRating.rating || 0);

      setReview(myRating.review || "");
    } else {
      setSelectedRating(0);
      setReview("");
    }
  };

  // =========================================================
  // DELETE MY RATING
  // =========================================================

  const handleDeleteMyRating = async () => {
    if (!movieId || !myRating) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete your rating and review?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRating(true);
      setRatingError("");

      const response = await api.delete(`/movie-ratings/${movieId}`);

      console.log("Rating deleted:", response.data);

      if (!response.data?.success) {
        throw new Error("Failed to delete rating");
      }

      setMyRating(null);
      setSelectedRating(0);
      setReview("");
      setEditingRating(false);

      if (response.data.stats) {
        setAverageRating(Number(response.data.stats.averageRating || 0));

        setRatingCount(Number(response.data.stats.ratingCount || 0));
      }

      // Refresh distribution + reviews
      await fetchMovieRatings(1);
    } catch (error) {
      console.error("Delete rating error:", error);

      setRatingError(
        error.response?.data?.message || "Failed to delete rating",
      );
    } finally {
      setDeletingRating(false);
    }
  };

  // =========================================================
  // FORMAT DURATION
  // =========================================================

  const formatDuration = (seconds) => {
    if (!seconds) return "";

    const totalMinutes = Math.floor(seconds / 60);

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  // =========================================================
  // FORMAT REVIEW DATE
  // =========================================================

  const formatReviewDate = (date) => {
    if (!date) return "";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // =========================================================
  // RATING STARS
  // =========================================================

  const renderStars = (value, size = 18, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({
          length: 5,
        }).map((_, index) => {
          const starValue = index + 1;

          const active = starValue <= value;

          return (
            <button
              key={starValue}
              type={interactive ? "button" : undefined}
              onClick={
                interactive ? () => setSelectedRating(starValue) : undefined
              }
              disabled={!interactive}
              className={
                interactive
                  ? "cursor-pointer transition-transform duration-150 hover:scale-110"
                  : "cursor-default"
              }
              aria-label={interactive ? `${starValue} stars` : undefined}
            >
              <Star
                size={size}
                fill={active ? "currentColor" : "none"}
                className={active ? "text-yellow-400" : "text-zinc-700"}
              />
            </button>
          );
        })}
      </div>
    );
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const handleRatingPageChange = (page) => {
    if (page < 1 || page > ratingPagination.totalPages) {
      return;
    }

    fetchMovieRatings(page);

    document.getElementById("movie-ratings")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] text-white">
        <Sidebar />

        <main className="lg:ml-64">
          <Topbar />

          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-500">
              <Loader2 size={20} className="animate-spin" />

              <span className="text-sm">Loading movie...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#08080c] text-white">
        <Sidebar />

        <main className="lg:ml-64">
          <Topbar />

          <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
            <h1 className="text-xl font-bold">Movie not found</h1>

            <p className="mt-2 text-sm text-zinc-500">
              {error || "This movie is unavailable."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500"
            >
              Go Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // MOVIE DATA
  // =========================================================

  const readyVideo = movie.videos?.find(
    (video) => video.status === "READY",
  );

  const genres =
    movie.genres?.map((item) => item.genre?.name).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Sidebar />

      <main className="lg:ml-64">
        <Topbar />

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative min-h-[620px] overflow-hidden">
          {/* BACKDROP */}

          <div className="absolute inset-0">
            <img
              src={movie.backdropUrl || movie.posterUrl}
              alt=""
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/80 to-[#08080c]/30" />

            <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-[#08080c]/30" />
          </div>

          {/* CONTENT */}

          <div className="relative z-10 flex min-h-[620px] items-end px-6 pb-12 pt-12 md:px-10 lg:px-12">
            <div className="w-full max-w-6xl">
              {/* BACK */}

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-8 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-sm text-zinc-300 backdrop-blur transition hover:bg-black/50 hover:text-white"
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <div className="flex flex-col gap-8 md:flex-row md:items-end">
                {/* POSTER */}

                <div className="hidden w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl md:block">
                  <img
                    src={movie.posterUrl || movie.backdropUrl}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover"
                  />
                </div>

                {/* INFO */}

                <div className="max-w-3xl">
                  {/* BADGES */}

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {movie.ageRating && (
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                        {movie.ageRating}
                      </span>
                    )}

                    {movie.releaseYear && (
                      <span className="text-sm text-zinc-400">
                        {movie.releaseYear}
                      </span>
                    )}

                    {movie.language && (
                      <span className="text-sm text-zinc-400">
                        • {movie.language}
                      </span>
                    )}
                  </div>

                  {/* TITLE */}

                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                    {movie.title}
                  </h1>

                  {/* RATING SUMMARY */}

                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      {renderStars(Math.round(averageRating), 18)}

                      <span className="text-sm font-semibold text-yellow-400">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>

                    <span className="text-sm text-zinc-500">
                      {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
                    </span>
                  </div>

                  {/* META */}

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                    {movie.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock3 size={16} />
                        {formatDuration(movie.duration)}
                      </div>
                    )}

                    {movie.releaseYear && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} />
                        {movie.releaseYear}
                      </div>
                    )}

                    {movie.language && (
                      <div className="flex items-center gap-1.5">
                        <Languages size={16} />
                        {movie.language}
                      </div>
                    )}

                    {movie.ageRating && (
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        {movie.ageRating}
                      </div>
                    )}
                  </div>

                  {/* GENRES */}

                  {genres.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* DESCRIPTION */}

                  {movie.description && (
                    <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                      {movie.description}
                    </p>
                  )}

                  {/* ACTION */}

                  <div className="mt-8 flex flex-wrap gap-3">
                    {/* WATCH NOW */}
                    <button
                      type="button"
                      onClick={handleWatchNow}
                      disabled={!readyVideo}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={18} fill="currentColor" />

                      {readyVideo ? "Watch Now" : "Video Unavailable"}
                    </button>

                    {/* MY LIST */}
                    <button
                      type="button"
                      onClick={handleToggleMyList}
                      disabled={myListLoading || myListSubmitting}
                      className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  </div>
                  {myListError && (
                    <p className="mt-2 text-xs text-red-400">{myListError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            DETAILS
        ================================================= */}

        <section className="px-6 py-10 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-2">
            {/* CATEGORY */}

            {movie.category && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Category
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {movie.category.name}
                </p>

                {movie.category.description && (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {movie.category.description}
                  </p>
                )}
              </div>
            )}

            {/* GENRES */}

            {genres.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-wider text-zinc-600">
                  Genres
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-zinc-400"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              RATINGS & REVIEWS
          ================================================= */}

          <section id="movie-ratings" className="mt-10">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
              {/* HEADER */}

              <div className="border-b border-white/5 pb-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
                    <Star
                      size={18}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">Ratings & Reviews</h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      What viewers think about this movie
                    </p>
                  </div>
                </div>

                {/* RATING SUMMARY */}

                <div className="mt-7 flex w-full flex-col gap-8 sm:flex-row sm:items-center">
                  {/* AVERAGE */}

                  <div className="flex shrink-0 items-center">
                    <div className="text-center">
                      <p className="text-4xl font-black text-white">
                        {averageRating.toFixed(1)}
                      </p>

                      <div className="mt-2 flex justify-center">
                        {renderStars(Math.round(averageRating), 16)}
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
                      </p>
                    </div>
                  </div>

                  {/* SEPARATOR */}

                  <div className="h-px w-full bg-white/5 sm:h-24 sm:w-px" />

                  {/* DISTRIBUTION */}

                  <div className="flex-1">
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const item = ratingDistribution.find(
                          (distributionItem) => distributionItem.star === star,
                        );

                        const count = item?.count || 0;

                        const percentage = item?.percentage || 0;

                        return (
                          <div key={star} className="flex items-center gap-3">
                            {/* STAR */}

                            <div className="flex w-10 shrink-0 items-center gap-1.5">
                              <span className="w-3 text-right text-xs font-medium text-zinc-400">
                                {star}
                              </span>

                              <Star
                                size={13}
                                fill="currentColor"
                                className="text-yellow-400"
                              />
                            </div>

                            {/* BAR */}

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-yellow-400 transition-all duration-700 ease-out"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>

                            {/* PERCENTAGE */}

                            <span className="w-14 text-right text-xs text-zinc-500">
                              {percentage}%
                            </span>

                            {/* COUNT */}

                            <span className="hidden w-8 text-right text-xs text-zinc-600 sm:block">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  YOUR RATING
              ================================================= */}

              <div
                id="movie-rating-form"
                className="mt-7 rounded-2xl border border-white/5 bg-black/20 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MessageSquare size={17} className="text-red-500" />

                      <h3 className="text-sm font-semibold text-white">
                        {myRating && !editingRating
                          ? "Your Rating"
                          : "Rate this movie"}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {myRating && !editingRating
                        ? "You have already rated this movie."
                        : "Select your rating and optionally write a review."}
                    </p>
                  </div>

                  {/* EDIT / DELETE */}

                  {myRating && !editingRating && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleEditRating}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteMyRating}
                        disabled={deletingRating}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/10 bg-red-500/[0.04] px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingRating ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* EXISTING MY RATING */}

                {myRating && !editingRating && (
                  <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {renderStars(myRating.rating, 18)}

                      <span className="text-sm font-semibold text-yellow-400">
                        {myRating.rating}
                        /5
                      </span>
                    </div>

                    {myRating.review && (
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {myRating.review}
                      </p>
                    )}

                    <p className="mt-3 text-[11px] text-zinc-600">
                      Updated {formatReviewDate(myRating.updatedAt)}
                    </p>
                  </div>
                )}

                {/* CREATE / EDIT FORM */}

                {(!myRating || editingRating) && (
                  <>
                    {/* STAR INPUT */}

                    <div className="mt-5">
                      <p className="mb-2 text-xs font-medium text-zinc-500">
                        Your Rating
                      </p>

                      {renderStars(selectedRating, 28, true)}

                      {selectedRating > 0 && (
                        <p className="mt-2 text-xs text-yellow-400">
                          {selectedRating}
                          /5
                        </p>
                      )}
                    </div>

                    {/* REVIEW */}

                    <div className="mt-5">
                      <label
                        htmlFor="movie-review"
                        className="mb-2 block text-xs font-medium text-zinc-500"
                      >
                        Review
                      </label>

                      <textarea
                        id="movie-review"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        placeholder="Write your thoughts about this movie..."
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#111116] px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-red-500/40"
                      />

                      <div className="mt-2 flex justify-end text-[11px] text-zinc-600">
                        {review.length}
                        /1000
                      </div>
                    </div>

                    {/* ERROR */}

                    {ratingError && (
                      <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/[0.05] px-4 py-3 text-xs text-red-400">
                        {ratingError}
                      </div>
                    )}

                    {/* BUTTONS */}

                    <div className="mt-5 flex justify-end gap-2">
                      {editingRating && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={submittingRating}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                        >
                          <X size={15} />
                          Cancel
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitRating}
                        disabled={submittingRating || selectedRating === 0}
                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submittingRating ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send size={15} />

                            {editingRating ? "Update Rating" : "Submit Rating"}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* =================================================
                  REVIEWS
              ================================================= */}

              <div className="mt-8">
                <div className="mb-5">
                  <h3 className="text-base font-bold">Reviews</h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {ratingPagination.total} total reviews
                  </p>
                </div>

                {/* LOADING */}

                {ratingLoading && (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 size={18} className="animate-spin" />
                      Loading reviews...
                    </div>
                  </div>
                )}

                {/* ERROR */}

                {!ratingLoading && ratingError && (
                  <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5 text-center">
                    <p className="text-sm text-red-400">{ratingError}</p>

                    <button
                      type="button"
                      onClick={() => fetchMovieRatings(ratingPage)}
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* EMPTY */}

                {!ratingLoading && !ratingError && ratings.length === 0 && (
                  <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                    <MessageSquare size={30} className="text-zinc-700" />

                    <p className="mt-3 text-sm font-medium text-zinc-400">
                      No reviews yet
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Be the first to rate this movie.
                    </p>
                  </div>
                )}

                {/* REVIEW LIST */}

                {!ratingLoading && !ratingError && ratings.length > 0 && (
                  <div className="space-y-4">
                    {ratings.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-xs font-bold text-red-400">
                                U
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-white">
                                  User
                                </p>

                                <p className="mt-0.5 text-[11px] text-zinc-600">
                                  {formatReviewDate(item.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {renderStars(item.rating, 14)}
                          </div>
                        </div>

                        {item.review && (
                          <p className="mt-4 text-sm leading-6 text-zinc-400">
                            {item.review}
                          </p>
                        )}

                        {item.updatedAt !== item.createdAt && (
                          <p className="mt-3 text-[11px] text-zinc-600">
                            Edited
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                {/* PAGINATION */}

                {!ratingLoading &&
                  !ratingError &&
                  ratingPagination.totalPages > 1 && (
                    <div className="mt-7 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        disabled={!ratingPagination.hasPreviousPage}
                        onClick={() => handleRatingPageChange(ratingPage - 1)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft size={14} />
                        Previous
                      </button>

                      <div className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">
                        {ratingPage}
                      </div>

                      <button
                        type="button"
                        disabled={!ratingPagination.hasNextPage}
                        onClick={() => handleRatingPageChange(ratingPage + 1)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default MovieDetails;
