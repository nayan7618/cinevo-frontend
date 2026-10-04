import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Film,
  RefreshCw,
  Check,
  ChevronDown,
} from "lucide-react";

import AdminMovieVideoModal from "./AdminMovieVideoModal";
import AdminAddMovie from "./AdminAddMovie";
import AdminEditMovie from "./AdminEditMovie";


/* =========================================================
   DARK SELECT
========================================================= */

const DarkSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  return (
    <div className="relative min-w-[170px]" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition ${
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-white/20"
        }`}
      >
        <span className={selectedOption ? "text-white" : "text-gray-500"}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
          <div className="p-1.5">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{option.label}</span>

                  {isSelected && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   ADMIN MOVIES
========================================================= */

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalMovies: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");

  const [videoMovie, setVideoMovie] = useState(null);

  const [showAddMovie, setShowAddMovie] = useState(false);

  const [editMovie, setEditMovie] = useState(null);

  const searchTimer = useRef(null);

  /* =========================================================
     FETCH MOVIES
  ========================================================= */

  const fetchMovies = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 20,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (status) {
          params.status = status;
        }

        const response = await api.get("/movies/admin", {
          params,
        });

        const data = response.data;

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch movies");
        }

        setMovies(data.movies || []);

        setPagination(
          data.pagination || {
            page,
            limit: 20,
            totalMovies: data.movies?.length || 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        );
      } catch (err) {
        console.error("Admin movies fetch error:", err);

        setError(
          err.response?.data?.message || err.message || "Failed to load movies",
        );

        setMovies([]);
      } finally {
        setLoading(false);
      }
    },
    [search, status],
  );

  /* =========================================================
     SEARCH DEBOUNCE
  ========================================================= */

  useEffect(() => {
    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      fetchMovies(1);
    }, 400);

    return () => {
      clearTimeout(searchTimer.current);
    };
  }, [search, status, fetchMovies]);

  /* =========================================================
     PUBLISH MOVIE
  ========================================================= */

  const handlePublish = async (movieId) => {
    try {
      setActionLoading(`publish-${movieId}`);

      setError("");

      const response = await api.patch(`/movies/${movieId}/publish`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to publish movie");
      }

      await fetchMovies(pagination.page);
    } catch (err) {
      console.error("Publish movie error:", err);

      setError(
        err.response?.data?.message || err.message || "Failed to publish movie",
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     DELETE MOVIE
  ========================================================= */

  const handleDelete = async (movie) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${movie.title}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${movie.id}`);

      setError("");

      const response = await api.delete(`/movies/${movie.id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete movie");
      }

      const currentPage = pagination.page;

      if (movies.length === 1 && currentPage > 1) {
        await fetchMovies(currentPage - 1);
      } else {
        await fetchMovies(currentPage);
      }

      if (videoMovie?.id === movie.id) {
        setVideoMovie(null);
      }

      if (editMovie?.id === movie.id) {
        setEditMovie(null);
      }
    } catch (err) {
      console.error("Delete movie error:", err);

      setError(
        err.response?.data?.message || err.message || "Failed to delete movie",
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = () => {
    fetchMovies(pagination.page);
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const handlePrevious = () => {
    if (!pagination.hasPreviousPage) {
      return;
    }

    fetchMovies(pagination.page - 1);
  };

  const handleNext = () => {
    if (!pagination.hasNextPage) {
      return;
    }

    fetchMovies(pagination.page + 1);
  };

  /* =========================================================
     FORMAT GENRES
  ========================================================= */

  const formatGenres = (movie) => {
    if (!movie.genres?.length) {
      return "—";
    }

    return movie.genres
      .map((item) => item.genre?.name)
      .filter(Boolean)
      .join(", ");
  };

  /* =========================================================
     STATUS STYLE
  ========================================================= */

  const getStatusClasses = (movieStatus) => {
    if (movieStatus === "PUBLISHED") {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }

    if (movieStatus === "DRAFT") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    if (movieStatus === "PROCESSING") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }

    return "bg-white/10 text-white/70 border-white/10";
  };

  /* =========================================================
     STATUS OPTIONS
  ========================================================= */

  const statusOptions = [
    {
      value: "",
      label: "All Status",
    },
    {
      value: "DRAFT",
      label: "Draft",
    },
    {
      value: "PUBLISHED",
      label: "Published",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-full p-4 text-white sm:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/15">
              <Film className="h-5 w-5 text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Movies</h1>

              <p className="text-sm text-white/50">Manage your movie library</p>
            </div>
          </div>
        </div>

        {/* ADD MOVIE */}

        <button
          type="button"
          onClick={() => setShowAddMovie(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Add Movie
        </button>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies..."
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500/50"
            />
          </div>

          {/* STATUS */}

          <DarkSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
            }}
            options={statusOptions}
            placeholder="All Status"
          />

          {/* REFRESH */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-300 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================================
          MOVIE TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-[1150px] w-full">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-5 py-4 font-medium">Movie</th>

                <th className="px-5 py-4 font-medium">Category</th>

                <th className="px-5 py-4 font-medium">Genres</th>

                <th className="px-5 py-4 font-medium">Year</th>

                <th className="px-5 py-4 font-medium">Status</th>

                <th className="px-5 py-4 font-medium">Views</th>

                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-white/50">
                      <Loader2 className="h-8 w-8 animate-spin" />

                      <span className="text-sm">Loading movies...</span>
                    </div>
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                /* EMPTY */

                <tr>
                  <td colSpan="7" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <Film className="h-10 w-10 text-white/20" />

                      <div>
                        <p className="font-medium text-white/70">
                          No movies found
                        </p>

                        <p className="mt-1 text-sm text-white/40">
                          Try another search or filter.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* MOVIES */

                movies.map((movie) => {
                  const publishLoading =
                    actionLoading === `publish-${movie.id}`;

                  const deleteLoading = actionLoading === `delete-${movie.id}`;

                  return (
                    <tr
                      key={movie.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      {/* MOVIE */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-white/10">
                            {movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Film className="h-5 w-5 text-white/20" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {movie.title}
                            </p>

                            <p className="mt-1 max-w-[280px] truncate text-xs text-white/40">
                              {movie.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4 text-sm text-white/70">
                        {movie.category?.name || "—"}
                      </td>

                      {/* GENRES */}

                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate text-sm text-white/60">
                          {formatGenres(movie)}
                        </p>
                      </td>

                      {/* YEAR */}

                      <td className="px-5 py-4 text-sm text-white/70">
                        {movie.releaseYear || "—"}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                            movie.status,
                          )}`}
                        >
                          {movie.status || "UNKNOWN"}
                        </span>
                      </td>

                      {/* VIEWS */}

                      <td className="px-5 py-4 text-sm text-white/60">
                        {movie._count?.viewEvents ?? movie.views ?? 0}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() => setEditMovie(movie)}
                            title="Edit movie"
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* VIDEO */}

                          <button
                            type="button"
                            onClick={() => setVideoMovie(movie)}
                            title="Manage video"
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400 transition hover:bg-blue-500/20"
                          >
                            <Film className="h-4 w-4" />
                          </button>

                          {/* PUBLISH */}

                          {movie.status !== "PUBLISHED" && (
                            <button
                              type="button"
                              onClick={() => handlePublish(movie.id)}
                              disabled={publishLoading || deleteLoading}
                              title="Publish movie"
                              className="rounded-lg border border-green-500/20 bg-green-500/10 p-2 text-green-400 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {publishLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() => handleDelete(movie)}
                            disabled={publishLoading || deleteLoading}
                            title="Delete movie"
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleteLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading && movies.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/40">
              Page{" "}
              <span className="font-medium text-white/70">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-medium text-white/70">
                {pagination.totalPages}
              </span>{" "}
              ·{" "}
              <span className="font-medium text-white/70">
                {pagination.totalMovies}
              </span>{" "}
              movies
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!pagination.hasPreviousPage}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          VIDEO MODAL
      ===================================================== */}

      {videoMovie && (
        <AdminMovieVideoModal
          movie={videoMovie}
          onClose={() => setVideoMovie(null)}
          onSuccess={() => {
            fetchMovies(pagination.page);
          }}
        />
      )}

      {/* =====================================================
          ADD MOVIE MODAL
      ===================================================== */}

      {showAddMovie && (
        <AdminAddMovie
          onClose={() => setShowAddMovie(false)}
          onMovieCreated={() => {
            setShowAddMovie(false);
            fetchMovies(1);
          }}
        />
      )}

      {/* =====================================================
          EDIT MOVIE MODAL
      ===================================================== */}

      {editMovie && (
        <AdminEditMovie
          movie={editMovie}
          onClose={() => setEditMovie(null)}
          onMovieUpdated={() => {
            setEditMovie(null);

            fetchMovies(pagination.page);
          }}
        />
      )}
    </div>
  );
};

export default AdminMovies;
