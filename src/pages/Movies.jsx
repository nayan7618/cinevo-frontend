import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"
import {
  Film,
  Play,
  AlertCircle,
  Filter,
  RotateCcw,
  Star,
} from "lucide-react";

import AnimatedSelect from "../components/AnimatedSelect";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";



const Movies = () => {
  const navigate = useNavigate();

  // =========================
  // MOVIES
  // =========================
  const [movies, setMovies] = useState([]);

  // =========================
  // FILTER OPTIONS
  // =========================
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);

  // =========================
  // SELECTED FILTERS
  // =========================
  const [selectedCategory, setSelectedCategory] =
    useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedRating, setSelectedRating] =
    useState("");
  const [selectedSort, setSelectedSort] =
    useState("latest");

  // =========================
  // STATES
  // =========================
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] =
    useState(false);
  const [error, setError] = useState("");

  // =========================
  // PAGINATION
  // =========================
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalMovies: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // =========================
  // FETCH FILTER OPTIONS
  // =========================
  const fetchFilters = async () => {
    try {
      const [
        categoryResponse,
        genreResponse,
      ] = await Promise.all([
        api.get(`/categories`),
        api.get(`/genres`),
      ]);

      console.log(
        "📂 Categories:",
        categoryResponse.data
      );

      console.log(
        "🎭 Genres:",
        genreResponse.data
      );

      setCategories(
        categoryResponse.data.categories || []
      );

      setGenres(
        genreResponse.data.genres || []
      );
    } catch (err) {
      console.error(
        "❌ Filter API Error:",
        err
      );
    }
  };

  // =========================
  // FETCH MOVIES
  // =========================
  const fetchMovies = async (
    page = 1,
    categoryId = "",
    genreId = "",
    language = "",
    releaseYear = "",
    rating = "",
    sort = "latest",
  ) => {
    try {
      if (
        page === 1 &&
        !movies.length
      ) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }

      setError("");

      const params = {
        page,
        limit: 20,
        sort,
      };

      if (categoryId) {
        params.categoryId = categoryId;
      }

      if (genreId) {
        params.genreId = genreId;
      }

      if (language) {
        params.language = language;
      }

      if (releaseYear) {
        params.releaseYear = releaseYear;
      }

      if (rating) {
        params.rating = rating;
      }

      console.log(
        "🎬 Movie params:",
        params
      );

      const response = await api.get(
        `/movies`,
        {
          params,
        }
      );

      console.log(
        "🎬 Movies API:",
        response.data
      );

      const data = response.data;

      setMovies(
        data.movies || []
      );

      setPagination(
        data.pagination || {
          page: 1,
          limit: 20,
          totalMovies: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      );
    } catch (err) {
      console.error(
        "❌ Movies API Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load movies"
      );
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchFilters();

    fetchMovies(
      1,
      "",
      "",
      "",
      "",
      "",
      "latest"
    );
  }, []);

  // =========================
  // CATEGORY CHANGE
  // =========================
  const handleCategoryChange = (
    value
  ) => {
    setSelectedCategory(value);

    fetchMovies(
      1,
      value,
      selectedGenre,
      selectedLanguage,
      selectedYear,
      selectedRating,
      selectedSort,
    );
  };

  // =========================
  // GENRE CHANGE
  // =========================
  const handleGenreChange = (
    value
  ) => {
    setSelectedGenre(value);

    fetchMovies(
      1,
      selectedCategory,
      value,
      selectedLanguage,
      selectedYear,
      selectedRating,
      selectedSort,
    );
  };

  // =========================
  // LANGUAGE CHANGE
  // =========================
  const handleLanguageChange = (
    value
  ) => {
    setSelectedLanguage(value);

    fetchMovies(
      1,
      selectedCategory,
      selectedGenre,
      value,
      selectedYear,
      selectedRating,
      selectedSort,
    );
  };

  // =========================
  // YEAR CHANGE
  // =========================
  const handleYearChange = (
    value
  ) => {
    setSelectedYear(value);

    fetchMovies(
      1,
      selectedCategory,
      selectedGenre,
      selectedLanguage,
      value,
      selectedRating,
      selectedSort,
    );
  };

  // =========================
  // RATING CHANGE
  // =========================
  const handleRatingChange = (
    value
  ) => {
    setSelectedRating(value);

    fetchMovies(
      1,
      selectedCategory,
      selectedGenre,
      selectedLanguage,
      selectedYear,
      value,
      selectedSort,
    );
  };

  // =========================
  // SORT CHANGE
  // =========================
  const handleSortChange = (
    value
  ) => {
    setSelectedSort(value);

    fetchMovies(
      1,
      selectedCategory,
      selectedGenre,
      selectedLanguage,
      selectedYear,
      selectedRating,
      value,
    );
  };

  // =========================
  // RESET FILTERS
  // =========================
  const handleReset = () => {
    setSelectedCategory("");
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedYear("");
    setSelectedRating("");
    setSelectedSort("latest");

    fetchMovies(
      1,
      "",
      "",
      "",
      "",
      "",
      "latest"
    );
  };

  // =========================
  // PAGINATION
  // =========================
  const handlePageChange = (
    page
  ) => {
    fetchMovies(
      page,
      selectedCategory,
      selectedGenre,
      selectedLanguage,
      selectedYear,
      selectedRating,
      selectedSort,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // ACTIVE FILTER CHECK
  // =========================
  const hasActiveFilters =
    selectedCategory ||
    selectedGenre ||
    selectedLanguage ||
    selectedYear ||
    selectedRating ||
    selectedSort !== "latest";

  // =========================
  // LOADING SKELETON
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white">
        <Sidebar />

        <div className="lg:ml-64">
          <Topbar />

          <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <div className="h-8 w-32 animate-pulse rounded bg-white/[0.05]" />

                <div className="mt-3 h-4 w-64 animate-pulse rounded bg-white/[0.05]" />
              </div>

              <div className="mb-8">
                <div className="h-12 w-32 animate-pulse rounded-xl bg-white/[0.05]" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 xl:grid-cols-5">
                {Array.from({
                  length: 10,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]"
                  >
                    <div className="aspect-[2/3] animate-pulse bg-white/[0.05]" />

                    <div className="space-y-2 p-4">
                      <div className="h-4 animate-pulse rounded bg-white/[0.05]" />

                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Sidebar />

      <div className="lg:ml-64">
        <Topbar />

        <main className="px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">

            {/* =========================
                HEADER
            ========================= */}

            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
                    <Film size={22} />
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold">
                      Movies
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                      Explore our movie collection
                    </p>
                  </div>
                </div>
              </div>

              {pagination.totalMovies >
                0 && (
                <p className="hidden text-sm text-zinc-500 sm:block">
                  {pagination.totalMovies} movies
                </p>
              )}
            </div>

            {/* =========================
                FILTER AREA
            ========================= */}

            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10">
                    <Filter
                      size={16}
                      className="text-red-500"
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Filters
                    </h2>

                    <p className="text-xs text-zinc-500">
                      Refine your movie search
                    </p>
                  </div>
                </div>

                {filterLoading && (
                  <span className="text-xs text-zinc-500">
                    Updating...
                  </span>
                )}
              </div>

              {/* FILTERS */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                {/* CATEGORY */}

                <AnimatedSelect
                  value={selectedCategory}
                  onChange={
                    handleCategoryChange
                  }
                  placeholder="All Categories"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "",
                      label: "All Categories",
                    },

                    ...categories.map(
                      (category) => ({
                        value: category.id,
                        label: category.name,
                      })
                    ),
                  ]}
                />

                {/* GENRE */}

                <AnimatedSelect
                  value={selectedGenre}
                  onChange={
                    handleGenreChange
                  }
                  placeholder="All Genres"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "",
                      label: "All Genres",
                    },

                    ...genres.map(
                      (genre) => ({
                        value: genre.id,
                        label: genre.name,
                      })
                    ),
                  ]}
                />

                {/* LANGUAGE */}

                <AnimatedSelect
                  value={selectedLanguage}
                  onChange={
                    handleLanguageChange
                  }
                  placeholder="All Languages"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "",
                      label: "All Languages",
                    },
                    {
                      value: "Hindi",
                      label: "Hindi",
                    },
                    {
                      value: "English",
                      label: "English",
                    },
                    {
                      value: "Bengali",
                      label: "Bengali",
                    },
                    {
                      value: "Tamil",
                      label: "Tamil",
                    },
                    {
                      value: "Telugu",
                      label: "Telugu",
                    },
                    {
                      value: "Malayalam",
                      label: "Malayalam",
                    },
                    {
                      value: "Kannada",
                      label: "Kannada",
                    },
                    {
                      value: "Marathi",
                      label: "Marathi",
                    },
                    {
                      value: "Punjabi",
                      label: "Punjabi",
                    },
                  ]}
                />

                {/* YEAR */}

                <AnimatedSelect
                  value={selectedYear}
                  onChange={
                    handleYearChange
                  }
                  placeholder="All Years"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "",
                      label: "All Years",
                    },
                    {
                      value: "2026",
                      label: "2026",
                    },
                    {
                      value: "2025",
                      label: "2025",
                    },
                    {
                      value: "2024",
                      label: "2024",
                    },
                    {
                      value: "2023",
                      label: "2023",
                    },
                    {
                      value: "2022",
                      label: "2022",
                    },
                    {
                      value: "2021",
                      label: "2021",
                    },
                    {
                      value: "2020",
                      label: "2020",
                    },
                    {
                      value: "2019",
                      label: "2019",
                    },
                    {
                      value: "2018",
                      label: "2018",
                    },
                    {
                      value: "2017",
                      label: "2017",
                    },
                    {
                      value: "2016",
                      label: "2016",
                    },
                    {
                      value: "2015",
                      label: "2015",
                    },
                  ]}
                />

                {/* RATING */}

                <AnimatedSelect
                  value={selectedRating}
                  onChange={
                    handleRatingChange
                  }
                  placeholder="All Ratings"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "",
                      label: "All Ratings",
                    },
                    {
                      value: "5",
                      label: "5+ Rating",
                    },
                    {
                      value: "4",
                      label: "4+ Rating",
                    },
                    {
                      value: "3",
                      label: "3+ Rating",
                    },
                    {
                      value: "2",
                      label: "2+ Rating",
                    },
                    {
                      value: "1",
                      label: "1+ Rating",
                    },
                  ]}
                />

                {/* SORT */}

                <AnimatedSelect
                  value={selectedSort}
                  onChange={
                    handleSortChange
                  }
                  placeholder="Latest"
                  disabled={
                    filterLoading
                  }
                  options={[
                    {
                      value: "latest",
                      label: "Latest",
                    },
                    {
                      value: "oldest",
                      label: "Oldest",
                    },
                    {
                      value: "rating",
                      label: "Highest Rated",
                    },
                    {
                      value: "az",
                      label: "A–Z",
                    },
                    {
                      value: "za",
                      label: "Z–A",
                    },
                  ]}
                />
              </div>

              {/* ACTIVE FILTERS */}

              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                  <span className="text-xs text-zinc-500">
                    Active:
                  </span>

                  {selectedCategory && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      Category
                    </span>
                  )}

                  {selectedGenre && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      Genre
                    </span>
                  )}

                  {selectedLanguage && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      {selectedLanguage}
                    </span>
                  )}

                  {selectedYear && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      {selectedYear}
                    </span>
                  )}

                  {selectedRating && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      {selectedRating}+ Rating
                    </span>
                  )}

                  {selectedSort !==
                    "latest" && (
                    <span className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300">
                      {selectedSort ===
                      "rating"
                        ? "Highest Rated"
                        : selectedSort ===
                            "oldest"
                          ? "Oldest"
                          : selectedSort ===
                              "az"
                            ? "A–Z"
                            : "Z–A"}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    disabled={
                      filterLoading
                    }
                    className="ml-auto flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white disabled:opacity-50"
                  >
                    <RotateCcw
                      size={13}
                    />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* =========================
                ERROR
            ========================= */}

            {error && (
              <div className="mb-8 flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/[0.03]">
                <AlertCircle
                  size={40}
                  className="mb-4 text-red-500"
                />

                <h2 className="text-lg font-semibold">
                  Unable to load movies
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {error}
                </p>

                <button
                  onClick={() =>
                    fetchMovies(
                      1,
                      selectedCategory,
                      selectedGenre,
                      selectedLanguage,
                      selectedYear,
                      selectedRating,
                      selectedSort,
                    )
                  }
                  className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* =========================
                EMPTY
            ========================= */}

            {!error &&
              !filterLoading &&
              movies.length === 0 && (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
                  <Film
                    size={40}
                    className="mb-4 text-zinc-700"
                  />

                  <h2 className="text-lg font-semibold">
                    No movies found
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Try changing your filters.
                  </p>

                  <button
                    onClick={
                      handleReset
                    }
                    className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

            {/* =========================
                MOVIE GRID
            ========================= */}

            {!error &&
              movies.length > 0 && (
                <div
                  className={`grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 xl:grid-cols-5 ${
                    filterLoading
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  {movies.map(
                    (movie) => {
                      const rating =
                        Number(
                          movie.averageRating ||
                            0
                        );

                      const quality =
                        movie.videos
                          ?.length > 0
                          ? movie
                              .videos[0]
                              .quality
                          : null;

                      const qualityLabel =
                        quality ===
                        "FULL_HD"
                          ? "FHD"
                          : quality ===
                              "HD"
                            ? "HD"
                            : quality;

                      return (
                        <article
                          key={movie.id}
                          onClick={() =>
                            navigate(
                              `/movie/${movie.id}`
                            )
                          }
                          className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-black/30"
                        >
                          {/* POSTER */}

                          <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                            {movie.posterUrl ? (
                              <img
                                src={
                                  movie.posterUrl
                                }
                                alt={
                                  movie.title
                                }
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Film
                                  size={45}
                                  className="text-zinc-700"
                                />
                              </div>
                            )}

                            {/* QUALITY */}

                            {qualityLabel && (
                              <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                                {
                                  qualityLabel
                                }
                              </span>
                            )}

                            {/* AGE RATING */}

                            {movie.ageRating && (
                              <span className="absolute right-2 top-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                                {
                                  movie.ageRating
                                }
                              </span>
                            )}

                            {/* PLAY */}

                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-xl shadow-red-950/30 transition-transform duration-300 group-hover:scale-110">
                                <Play
                                  size={20}
                                  fill="currentColor"
                                  className="ml-0.5"
                                />
                              </div>
                            </div>
                          </div>

                          {/* MOVIE INFO */}

                          <div className="p-4">
                            <h2 className="truncate text-sm font-semibold text-white">
                              {
                                movie.title
                              }
                            </h2>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">

                              {/* RATING */}

                              {rating > 0 && (
                                <span className="flex items-center gap-1 font-medium text-yellow-400">
                                  <Star
                                    size={13}
                                    fill="currentColor"
                                  />

                                  {rating.toFixed(
                                    1
                                  )}
                                </span>
                              )}

                              {/* RATING COUNT */}

                              {movie.ratingCount >
                                0 && (
                                <span className="text-zinc-600">
                                  (
                                  {
                                    movie.ratingCount
                                  }
                                  )
                                </span>
                              )}

                              {/* YEAR */}

                              {movie.releaseYear && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span>
                                    {
                                      movie.releaseYear
                                    }
                                  </span>
                                </>
                              )}

                              {/* LANGUAGE */}

                              {movie.language && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span>
                                    {
                                      movie.language
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}

            {/* =========================
                PAGINATION
            ========================= */}

            {!error &&
              movies.length > 0 &&
              pagination.totalPages >
                1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    disabled={
                      !pagination.hasPreviousPage ||
                      filterLoading
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page -
                          1
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Previous
                  </button>

                  <div className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-red-950/20">
                    {
                      pagination.page
                    }
                  </div>

                  <button
                    disabled={
                      !pagination.hasNextPage ||
                      filterLoading
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page +
                          1
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Movies;