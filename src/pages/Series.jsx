import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"
import {
  Search,
  Star,
  Play,
  Tv,
  Layers,
  Film,
  AlertCircle,
  Loader2,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const Series = () => {
  const navigate = useNavigate();

  const [series, setSeries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // FETCH SERIES
  // --------------------------------------------------
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/series");

        const data = response.data;

        if (data?.success && Array.isArray(data.series)) {
          // Public OTT page -> only published series
          const publishedSeries = data.series.filter(
            (item) => item.status === "PUBLISHED"
          );

          setSeries(publishedSeries);
        } else {
          setSeries([]);
        }
      } catch (err) {
        console.error("Failed to fetch series:", err);

        setError(
          err?.response?.data?.message ||
            "Failed to load series. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  // --------------------------------------------------
  // GENRES
  // --------------------------------------------------
  const genres = useMemo(() => {
    const genreSet = new Set();

    series.forEach((item) => {
      if (!Array.isArray(item.genres)) return;

      item.genres.forEach((genreItem) => {
        const genreName = genreItem?.genre?.name;

        if (genreName) {
          genreSet.add(genreName);
        }
      });
    });

    return ["All", ...Array.from(genreSet).sort()];
  }, [series]);

  // --------------------------------------------------
  // FILTER SERIES
  // --------------------------------------------------
  const filteredSeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return series.filter((item) => {
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.language?.toLowerCase().includes(query);

      const itemGenres = Array.isArray(item.genres)
        ? item.genres
            .map((genreItem) => genreItem?.genre?.name)
            .filter(Boolean)
        : [];

      const matchesGenre =
        selectedGenre === "All" || itemGenres.includes(selectedGenre);

      return matchesSearch && matchesGenre;
    });
  }, [series, searchQuery, selectedGenre]);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------
  const getRating = (item) => {
    const rating = Number(item?.rating);

    return Number.isFinite(rating) ? rating.toFixed(1) : "0.0";
  };

  const getRatingCount = (item) => {
    const count = Number(item?.ratingCount);

    return Number.isFinite(count) ? count : 0;
  };

  const getGenres = (item) => {
    if (!Array.isArray(item?.genres)) return [];

    return item.genres
      .map((genreItem) => genreItem?.genre?.name)
      .filter(Boolean)
      .slice(0, 3);
  };

  const handleSeriesClick = (seriesId) => {
    if (!seriesId) return;

    navigate(`/series/${seriesId}`);
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <Sidebar />

        <div className="lg:ml-64">
          <Topbar />

          <main className="flex min-h-[80vh] items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-white" />

              <p className="text-sm text-gray-400">
                Loading series...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <Sidebar />

        <div className="lg:ml-64">
          <Topbar />

          <main className="flex min-h-[80vh] items-center justify-center px-6">
            <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>

              <h2 className="mb-2 text-xl font-semibold">
                Unable to load series
              </h2>

              <p className="mb-6 text-sm leading-6 text-gray-400">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      <Sidebar />

      <div className="lg:ml-64">
        <Topbar />

        <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          {/* HEADER */}
          <section className="mb-8">
            <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Tv className="h-5 w-5" />
                  </div>

                  <span className="text-sm font-medium text-gray-400">
                    Watch Now
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Series
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Explore the latest and most popular series available on
                  CineVo.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search series..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/20 focus:bg-white/[0.06]"
                />
              </div>
            </div>

            {/* GENRE FILTER */}
            {genres.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {genres.map((genre) => {
                  const active = selectedGenre === genre;

                  return (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* COUNT */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedGenre === "All"
                  ? "All Series"
                  : selectedGenre}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredSeries.length}{" "}
                {filteredSeries.length === 1 ? "series" : "series"} found
              </p>
            </div>
          </div>

          {/* EMPTY */}
          {filteredSeries.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="px-6 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-gray-600" />

                <h3 className="text-lg font-semibold">
                  No series found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another search term or genre.
                </p>
              </div>
            </div>
          ) : (
            /* SERIES GRID */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredSeries.map((item) => {
                const itemGenres = getGenres(item);
                const rating = getRating(item);
                const ratingCount = getRatingCount(item);

                return (
                  <article
                    key={item.id}
                    onClick={() => handleSeriesClick(item.id)}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    {/* POSTER */}
                    <div className="relative aspect-[2/3] overflow-hidden bg-[#16161d]">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.title || "Series poster"}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-12 w-12 text-gray-700" />
                        </div>
                      )}

                      {/* OVERLAY */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                      {/* PLAY BUTTON */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-2xl">
                          <Play className="ml-0.5 h-5 w-5 fill-current" />
                        </div>
                      </div>

                      {/* RATING */}
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />

                        <span className="text-xs font-semibold">
                          {rating}
                        </span>
                      </div>

                      {/* YEAR */}
                      {item.releaseYear && (
                        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-gray-200 backdrop-blur">
                          {item.releaseYear}
                        </div>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-3.5">
                      <h3 className="line-clamp-1 text-sm font-semibold text-white sm:text-base">
                        {item.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {item.totalSeasons || 0}{" "}
                          {Number(item.totalSeasons) === 1
                            ? "Season"
                            : "Seasons"}
                        </span>

                        <span>
                          {item.totalEpisodes || 0} Episodes
                        </span>
                      </div>

                      {/* GENRES */}
                      {itemGenres.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {itemGenres.map((genre) => (
                            <span
                              key={genre}
                              className="text-[11px] text-gray-500"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* LANGUAGE + RATING COUNT */}
                      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-500">
                        <span>
                          {item.language || "Unknown"}
                        </span>

                        <span>
                          {ratingCount}{" "}
                          {ratingCount === 1 ? "rating" : "ratings"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Series;