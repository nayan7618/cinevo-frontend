import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Search,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const PAGE_SIZE = 20;

const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Bengali",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Marathi",
];

const SORT_OPTIONS = [
  {
    label: "Newest",
    sortBy: "newest",
    sortOrder: "desc",
  },
  {
    label: "Oldest",
    sortBy: "newest",
    sortOrder: "asc",
  },
  {
    label: "Title A-Z",
    sortBy: "title",
    sortOrder: "asc",
  },
  {
    label: "Title Z-A",
    sortBy: "title",
    sortOrder: "desc",
  },
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // =========================================================
  // URL PARAMETERS
  // =========================================================

  const query = searchParams.get("q")?.trim() || "";

  const currentType = searchParams.get("type") || "all";

  const currentLanguage = searchParams.get("language") || "";

  const currentGenreId = searchParams.get("genreId") || "";

  const currentCategoryId = searchParams.get("categoryId") || "";

  const currentSortBy = searchParams.get("sortBy") || "newest";

  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  // =========================================================
  // STATE
  // =========================================================

  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);

  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);

  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // MY LIST
  // =========================================================
  const [myListIds, setMyListIds] = useState(new Set());
  const [myListLoading, setMyListLoading] = useState(false);
  const [myListSubmitting, setMyListSubmitting] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalResults: 0,
    totalPages: 1,
  });

  // =========================================================
  // FETCH GENRES + CATEGORIES
  // =========================================================

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);

        const [categoriesResponse, genresResponse] = await Promise.all([
          api.get("/categories"),
          api.get("/genres"),
        ]);

        console.log("Categories:", categoriesResponse.data);

        console.log("Genres:", genresResponse.data);

        setCategories(
          Array.isArray(categoriesResponse.data?.categories)
            ? categoriesResponse.data.categories
            : [],
        );

        setGenres(
          Array.isArray(genresResponse.data?.genres)
            ? genresResponse.data.genres
            : [],
        );
      } catch (error) {
        console.error("Search filters error:", error);

        setCategories([]);
        setGenres([]);
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // =========================================================
  // LOAD MY LIST
  // =========================================================
  useEffect(() => {
    const fetchMyList = async () => {
      try {
        setMyListLoading(true);

        const response = await api.get("/my-list");

        if (!response.data?.success) return;

        const ids = new Set(
          (response.data.items || []).map(
            (item) => `${item.type}-${item.content?.id}`,
          ),
        );

        setMyListIds(ids);
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Search My List error:", error);
        }
      } finally {
        setMyListLoading(false);
      }
    };

    fetchMyList();
  }, []);

  // =========================================================
  // TOGGLE MY LIST
  // =========================================================
  const toggleMyList = async (type, contentId) => {
    const key = `${type}-${contentId}`;

    try {
      setMyListSubmitting(key);

      if (myListIds.has(key)) {
        const response = await api.delete(`/my-list/${type}/${contentId}`);

        if (!response.data?.success) {
          throw new Error("Failed to remove from My List");
        }

        setMyListIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        const response = await api.post(
          "/my-list",
          { type, contentId }
        );

        if (!response.data?.success) {
          throw new Error("Failed to add to My List");
        }

        setMyListIds((prev) => new Set([...prev, key]));
      }
    } catch (error) {
      console.error("Search My List toggle error:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to update My List",
      );
    } finally {
      setMyListSubmitting("");
    }
  };

  // =========================================================
  // SEARCH API
  // =========================================================

  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setMovies([]);
      setSeries([]);

      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        totalResults: 0,
        totalPages: 1,
      });

      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        q: query,
        page: currentPage,
        limit: PAGE_SIZE,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
      };

      // TYPE

      if (currentType !== "all") {
        params.type = currentType;
      }

      // LANGUAGE

      if (currentLanguage) {
        params.language = currentLanguage;
      }

      // GENRE

      if (currentGenreId) {
        params.genreId = currentGenreId;
      }

      // CATEGORY

      if (currentCategoryId) {
        params.categoryId = currentCategoryId;
      }

      console.log("Search request params:", params);

      const response = await api.get("/search", {
        params,
      });

      console.log("Search API:", response.data);

      const data = response.data || {};
      const results = data.results || {};

      setMovies(Array.isArray(results.movies) ? results.movies : []);

      setSeries(Array.isArray(results.series) ? results.series : []);

      const apiPagination = data.pagination || {};

      const totalResults = Number(apiPagination.totalResults) || 0;

      const totalPages =
        Number(apiPagination.totalPages) ||
        Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

      setPagination({
        page: Number(apiPagination.page) || currentPage,

        limit: Number(apiPagination.limit) || PAGE_SIZE,

        totalResults,

        totalPages,
      });
    } catch (error) {
      console.error("Search error:", error);

      setError(
        error.response?.data?.message || "Failed to load search results",
      );

      setMovies([]);
      setSeries([]);

      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        totalResults: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [
    query,
    currentType,
    currentLanguage,
    currentGenreId,
    currentCategoryId,
    currentSortBy,
    currentSortOrder,
    currentPage,
  ]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  // =========================================================
  // UPDATE URL PARAMS
  // =========================================================

  const updateParams = useCallback(
    (updates) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === "all"
        ) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(value));
        }
      });

      // Filter/sort change -> page 1

      if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
        nextParams.set("page", "1");
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  // =========================================================
  // TYPE
  // =========================================================

  const changeType = (type) => {
    updateParams({
      type: type === "all" ? "" : type,
    });
  };

  // =========================================================
  // LANGUAGE
  // =========================================================

  const changeLanguage = (language) => {
    updateParams({
      language,
    });
  };

  // =========================================================
  // GENRE
  // =========================================================

  const changeGenre = (genreId) => {
    updateParams({
      genreId,
    });
  };

  // =========================================================
  // CATEGORY
  // =========================================================

  const changeCategory = (categoryId) => {
    updateParams({
      categoryId,
    });
  };

  // =========================================================
  // SORT
  // =========================================================

  const selectedSortValue = `${currentSortBy}-${currentSortOrder}`;

  const changeSort = (value) => {
    const selected = SORT_OPTIONS.find(
      (item) => `${item.sortBy}-${item.sortOrder}` === value,
    );

    if (!selected) return;

    updateParams({
      sortBy: selected.sortBy,
      sortOrder: selected.sortOrder,
    });
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("q", query);
    }

    setSearchParams(nextParams);
  };

  const hasActiveFilters =
    currentType !== "all" ||
    Boolean(currentLanguage) ||
    Boolean(currentGenreId) ||
    Boolean(currentCategoryId) ||
    currentSortBy !== "newest" ||
    currentSortOrder !== "desc";

  // =========================================================
  // PAGINATION
  // =========================================================

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages || page === currentPage) {
      return;
    }

    updateParams({
      page,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages;

    const current = currentPage;

    if (total <= 1) {
      return [];
    }

    const pages = [];

    const start = Math.max(1, current - 2);

    const end = Math.min(total, current + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [pagination.totalPages, currentPage]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const openMovie = (movie) => {
    if (!movie?.id) return;

    navigate(`/movie/${movie.id}`);
  };

  const openSeries = (show) => {
    if (!show?.id) return;

    navigate(`/series/${show.id}`);
  };

  // =========================================================
  // IMAGE
  // =========================================================

  const getImage = (item) => {
    return item?.posterUrl || item?.backdropUrl || "/images/placeholder.jpg";
  };

  // =========================================================
  // SELECTED FILTER NAMES
  // =========================================================

  const selectedGenre = genres.find((genre) => genre.id === currentGenreId);

  const selectedCategory = categories.find(
    (category) => category.id === currentCategoryId,
  );

  // =========================================================
  // TOTAL VISIBLE
  // =========================================================

  const totalVisibleResults = movies.length + series.length;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Sidebar />

      <main className="lg:ml-64">
        <Topbar />

        <div className="px-6 py-8">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
                <Search size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  Search Results
                </h1>

                {query ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    Results for{" "}
                    <span className="font-medium text-zinc-300">"{query}"</span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-500">
                    Search movies and series
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          {query && (
            <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex flex-col gap-3">
                {/* TOP FILTER ROW */}

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  {/* TYPE */}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeType("all")}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        currentType === "all"
                          ? "bg-red-600 text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      All
                    </button>

                    <button
                      type="button"
                      onClick={() => changeType("MOVIE")}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        currentType === "MOVIE"
                          ? "bg-red-600 text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      Movies
                    </button>

                    <button
                      type="button"
                      onClick={() => changeType("SERIES")}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        currentType === "SERIES"
                          ? "bg-red-600 text-white"
                          : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      Series
                    </button>
                  </div>

                  {/* FILTER CONTROLS */}

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-1 flex items-center gap-2 text-zinc-500">
                      <SlidersHorizontal size={16} />

                      <span className="hidden text-xs sm:block">Filters</span>
                    </div>

                    {/* LANGUAGE */}

                    <select
                      value={currentLanguage}
                      onChange={(e) => changeLanguage(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#111116] px-3 py-2 text-sm text-zinc-300 outline-none transition focus:border-red-500/50"
                    >
                      <option value="">All Languages</option>

                      {LANGUAGE_OPTIONS.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>

                    {/* GENRE */}

                    <select
                      value={currentGenreId}
                      onChange={(e) => changeGenre(e.target.value)}
                      disabled={filtersLoading}
                      className="rounded-lg border border-white/10 bg-[#111116] px-3 py-2 text-sm text-zinc-300 outline-none transition focus:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Genres</option>

                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>

                    {/* CATEGORY */}

                    <select
                      value={currentCategoryId}
                      onChange={(e) => changeCategory(e.target.value)}
                      disabled={filtersLoading}
                      className="rounded-lg border border-white/10 bg-[#111116] px-3 py-2 text-sm text-zinc-300 outline-none transition focus:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Categories</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {/* SORT */}

                    <select
                      value={selectedSortValue}
                      onChange={(e) => changeSort(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#111116] px-3 py-2 text-sm text-zinc-300 outline-none transition focus:border-red-500/50"
                    >
                      {SORT_OPTIONS.map((sort) => (
                        <option
                          key={`${sort.sortBy}-${sort.sortOrder}`}
                          value={`${sort.sortBy}-${sort.sortOrder}`}
                        >
                          {sort.label}
                        </option>
                      ))}
                    </select>

                    {/* CLEAR */}

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                      >
                        <X size={15} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* ACTIVE FILTERS */}

                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    {currentType !== "all" && (
                      <span className="rounded-md bg-red-600/10 px-2.5 py-1 text-xs text-red-400">
                        {currentType === "MOVIE" ? "Movies" : "Series"}
                      </span>
                    )}

                    {currentLanguage && (
                      <span className="rounded-md bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-400">
                        {currentLanguage}
                      </span>
                    )}

                    {selectedGenre && (
                      <span className="rounded-md bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-400">
                        {selectedGenre.name}
                      </span>
                    )}

                    {selectedCategory && (
                      <span className="rounded-md bg-white/[0.05] px-2.5 py-1 text-xs text-zinc-400">
                        {selectedCategory.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================
              NO QUERY
          ================================================= */}

          {!query && (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600">
                <Search size={28} />
              </div>

              <h2 className="text-lg font-semibold">Start searching</h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                Search for your favorite movies and series using the search bar
                above.
              </p>
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {query && loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {Array.from({
                length: 10,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]"
                >
                  <div className="aspect-[2/3] animate-pulse bg-zinc-900" />

                  <div className="space-y-2 p-3">
                    <div className="h-4 animate-pulse rounded bg-zinc-900" />

                    <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-900" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {query && !loading && error && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 px-6 py-14 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* =================================================
              RESULTS
          ================================================= */}

          {query && !loading && !error && totalVisibleResults > 0 && (
            <>
              {/* RESULT COUNT */}

              <div className="mb-6 text-sm text-zinc-500">
                {pagination.totalResults} result
                {pagination.totalResults !== 1 ? "s" : ""} found
              </div>

              {/* =================================================
                    MOVIES
                ================================================= */}

              {movies.length > 0 && (
                <section className="mb-10">
                  <div className="mb-5 flex items-center gap-2">
                    <Film size={19} className="text-red-500" />

                    <h2 className="text-xl font-bold">Movies</h2>

                    <span className="text-xs text-zinc-600">
                      {movies.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {movies.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => openMovie(movie)}
                        className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] text-left transition duration-200 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.05]"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                          <img
                            src={getImage(movie)}
                            alt={movie.title || "Movie"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder.jpg";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          {movie.ageRating && (
                            <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold backdrop-blur">
                              {movie.ageRating}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMyList("MOVIE", movie.id);
                            }}
                            disabled={myListSubmitting === `MOVIE-${movie.id}`}
                            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/65 text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-50"
                            aria-label={
                              myListIds.has(`MOVIE-${movie.id}`)
                                ? "Remove from My List"
                                : "Add to My List"
                            }
                          >
                            {myListSubmitting === `MOVIE-${movie.id}` ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : myListIds.has(`MOVIE-${movie.id}`) ? (
                              <BookmarkCheck size={16} />
                            ) : (
                              <Bookmark size={16} />
                            )}
                          </button>
                        </div>

                        <div className="p-3">
                          <h3 className="truncate text-sm font-semibold">
                            {movie.title}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                            {movie.releaseYear && (
                              <span>{movie.releaseYear}</span>
                            )}

                            {movie.language && (
                              <>
                                <span>•</span>

                                <span>{movie.language}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* =================================================
                    SERIES
                ================================================= */}

              {series.length > 0 && (
                <section className="mb-10">
                  <div className="mb-5 flex items-center gap-2">
                    <Tv size={19} className="text-red-500" />

                    <h2 className="text-xl font-bold">Series</h2>

                    <span className="text-xs text-zinc-600">
                      {series.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {series.map((show) => (
                      <button
                        key={show.id}
                        type="button"
                        onClick={() => openSeries(show)}
                        className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] text-left transition duration-200 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.05]"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                          <img
                            src={getImage(show)}
                            alt={show.title || "Series"}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = "/images/placeholder.jpg";
                            }}
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMyList("SERIES", show.id);
                            }}
                            disabled={myListSubmitting === `SERIES-${show.id}`}
                            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/65 text-white backdrop-blur transition hover:bg-red-600 disabled:opacity-50"
                            aria-label={
                              myListIds.has(`SERIES-${show.id}`)
                                ? "Remove from My List"
                                : "Add to My List"
                            }
                          >
                            {myListSubmitting === `SERIES-${show.id}` ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : myListIds.has(`SERIES-${show.id}`) ? (
                              <BookmarkCheck size={16} />
                            ) : (
                              <Bookmark size={16} />
                            )}
                          </button>
                        </div>

                        <div className="p-3">
                          <h3 className="truncate text-sm font-semibold">
                            {show.title}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                            <span>Series</span>

                            {show.releaseYear && (
                              <>
                                <span>•</span>

                                <span>{show.releaseYear}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* =================================================
                    PAGINATION
                ================================================= */}

              {pagination.totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* PAGES */}

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`h-10 min-w-10 rounded-lg px-3 text-sm font-medium transition ${
                        page === currentPage
                          ? "bg-red-600 text-white"
                          : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* NEXT */}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* =================================================
              EMPTY RESULT
          ================================================= */}

          {query && !loading && !error && totalVisibleResults === 0 && (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-20 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600">
                <Search size={28} />
              </div>

              <h2 className="text-lg font-semibold">No results found</h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                We couldn't find any content matching "{query}".
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;
