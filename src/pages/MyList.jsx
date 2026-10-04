import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  Bookmark,
  BookmarkX,
  Film,
  Tv,
  Loader2,
  RefreshCw,
  Play,
  Layers3,
  Trash2,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const MyList = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [removingId, setRemovingId] = useState(null);

  // Confirmation modal
  const [removeTarget, setRemoveTarget] = useState(null);

  // =========================================================
  // FETCH MY LIST
  // =========================================================
  const fetchMyList = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/my-list");

      if (!response.data?.success) {
        throw new Error("Failed to load My List");
      }

      setItems(Array.isArray(response.data.items) ? response.data.items : []);
    } catch (error) {
      console.error("My List error:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load My List",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyList();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================
  const filteredItems = useMemo(() => {
    if (filter === "ALL") {
      return items;
    }

    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  // =========================================================
  // COUNTS
  // =========================================================
  const movieCount = useMemo(
    () => items.filter((item) => item.type === "MOVIE").length,
    [items],
  );

  const seriesCount = useMemo(
    () => items.filter((item) => item.type === "SERIES").length,
    [items],
  );

  // =========================================================
  // OPEN CONTENT
  // =========================================================
  const handleOpenContent = (item) => {
    if (!item?.type || !item?.content?.id) {
      return;
    }

    if (item.type === "MOVIE") {
      navigate(`/movie/${item.content.id}`);
      return;
    }

    if (item.type === "SERIES") {
      navigate(`/series/${item.content.id}`);
    }
  };

  // =========================================================
  // OPEN REMOVE CONFIRMATION
  // =========================================================
  const requestRemove = (item) => {
    if (!item?.id) {
      return;
    }

    setRemoveTarget(item);
  };

  // =========================================================
  // REMOVE FROM MY LIST
  // =========================================================
  const confirmRemove = async () => {
    if (!removeTarget?.type || !removeTarget?.content?.id) {
      return;
    }

    const item = removeTarget;

    const removeKey = `${item.type}-${item.content.id}`;

    try {
      setRemovingId(removeKey);

      const response = await api.delete(
        `/my-list/${item.type}/${item.content.id}`,
      );

      if (!response.data?.success) {
        throw new Error("Failed to remove from My List");
      }

      // Instant UI update
      setItems((prev) =>
        prev.filter((currentItem) => currentItem.id !== item.id),
      );

      setRemoveTarget(null);
    } catch (error) {
      console.error("Remove My List error:", error);

      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove from My List",
      );
    } finally {
      setRemovingId(null);
    }
  };

  // =========================================================
  // DATE
  // =========================================================
  const formatAddedDate = (date) => {
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
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] text-white">
        <Sidebar />

        <main className="lg:ml-64">
          <Topbar />

          <div className="flex min-h-[75vh] items-center justify-center px-6">
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <Loader2 size={28} className="animate-spin" />

              <span className="text-sm">Loading your list...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Sidebar />

      <main className="lg:ml-64">
        <Topbar />

        <div className="px-4 py-7 sm:px-6 md:px-10 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {/* =================================================
                HEADER
            ================================================= */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600/10">
                    <Bookmark size={22} className="text-red-500" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                      My List
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                      Your saved movies and series
                    </p>
                  </div>
                </div>
              </div>

              {/* REFRESH */}
              <button
                type="button"
                onClick={fetchMyList}
                className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}
            {error && (
              <div className="mt-8 rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-400">
                      Unable to load My List
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">{error}</p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchMyList}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500"
                  >
                    <RefreshCw size={14} />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!error && (
              <>
                {/* =================================================
                    FILTERS
                ================================================= */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      filter === "ALL"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    All
                    <span className="ml-1.5 opacity-70">{items.length}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("MOVIE")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      filter === "MOVIE"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Film size={15} />
                    Movies
                    <span className="opacity-70">{movieCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("SERIES")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      filter === "SERIES"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Tv size={15} />
                    Series
                    <span className="opacity-70">{seriesCount}</span>
                  </button>
                </div>

                {/* =================================================
                    EMPTY
                ================================================= */}
                {filteredItems.length === 0 && (
                  <div className="mt-8 flex min-h-[430px] flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
                      <BookmarkX size={30} className="text-zinc-600" />
                    </div>

                    <h2 className="mt-5 text-lg font-bold text-zinc-300">
                      {items.length === 0
                        ? "Your list is empty"
                        : "No content here"}
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
                      {items.length === 0
                        ? "Save movies and series from their details page and they will appear here."
                        : `You haven't saved any ${
                            filter === "MOVIE" ? "movies" : "series"
                          } yet.`}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(filter === "SERIES" ? "/series" : "/movies")
                      }
                      className="mt-6 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
                    >
                      <Play size={16} fill="currentColor" />

                      {filter === "SERIES" ? "Browse Series" : "Browse Movies"}
                    </button>
                  </div>
                )}

                {/* =================================================
                    GRID
                ================================================= */}
                {filteredItems.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {filteredItems.map((item) => {
                      const content = item?.content;

                      if (!content) {
                        return null;
                      }

                      const isMovie = item.type === "MOVIE";

                      const removeKey = `${item.type}-${content.id}`;

                      const isRemoving = removingId === removeKey;

                      const imageUrl = content.posterUrl || content.backdropUrl;

                      return (
                        <article
                          key={item.id}
                          className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04]"
                        >
                          {/* POSTER */}
                          <div className="relative aspect-[2/3] overflow-hidden bg-[#111116]">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={content.title || "Content"}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                {isMovie ? (
                                  <Film size={36} className="text-zinc-700" />
                                ) : (
                                  <Tv size={36} className="text-zinc-700" />
                                )}
                              </div>
                            )}

                            {/* DARK OVERLAY */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                            {/* TYPE BADGE */}
                            <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur">
                              {isMovie ? "Movie" : "Series"}
                            </div>

                            {/* REMOVE */}
                            <button
                              type="button"
                              onClick={() => requestRemove(item)}
                              disabled={isRemoving}
                              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/65 text-zinc-300 opacity-100 backdrop-blur transition hover:border-red-500/30 hover:bg-red-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label="Remove from My List"
                            >
                              {isRemoving ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>

                            {/* PLAY */}
                            <button
                              type="button"
                              onClick={() => handleOpenContent(item)}
                              className="absolute bottom-4 left-1/2 flex h-11 w-11 -translate-x-1/2 translate-y-3 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition duration-300 hover:scale-105 group-hover:translate-y-0 group-hover:opacity-100"
                              aria-label="Open content"
                            >
                              <Play size={18} fill="currentColor" />
                            </button>
                          </div>

                          {/* INFO */}
                          <div className="p-4">
                            <button
                              type="button"
                              onClick={() => handleOpenContent(item)}
                              className="block w-full text-left"
                            >
                              <h3 className="truncate text-sm font-bold text-white transition hover:text-red-400">
                                {content.title || "Untitled"}
                              </h3>
                            </button>

                            {/* MOVIE META */}
                            {isMovie && (
                              <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                                {content.releaseYear && (
                                  <span>{content.releaseYear}</span>
                                )}

                                {content.duration && (
                                  <>
                                    <span>•</span>

                                    <span>
                                      {Math.round(content.duration / 60)}m
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* SERIES META */}
                            {!isMovie && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
                                <Layers3 size={12} />

                                <span>
                                  {content.seasonCount ?? 0}{" "}
                                  {content.seasonCount === 1
                                    ? "season"
                                    : "seasons"}
                                </span>
                              </div>
                            )}

                            <p className="mt-3 text-[10px] text-zinc-700">
                              Added {formatAddedDate(item.addedAt)}
                            </p>

                            {/* MOBILE REMOVE */}
                            <button
                              type="button"
                              onClick={() => requestRemove(item)}
                              disabled={isRemoving}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-red-500/20 hover:bg-red-500/[0.06] hover:text-red-400 sm:hidden"
                            >
                              {isRemoving ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <BookmarkX size={13} />
                              )}
                              Remove
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* =========================================================
          REMOVE CONFIRMATION MODAL
      ========================================================= */}
      {removeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121218] p-6 shadow-2xl">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Remove from My List?
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  This item will be removed from your saved list.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#1a1a21]">
                {removeTarget.content?.posterUrl ? (
                  <img
                    src={removeTarget.content.posterUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {removeTarget.type === "MOVIE" ? (
                      <Film size={18} className="text-zinc-700" />
                    ) : (
                      <Tv size={18} className="text-zinc-700" />
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {removeTarget.content?.title || "Untitled"}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  {removeTarget.type === "MOVIE" ? "Movie" : "Series"}
                </p>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={Boolean(removingId)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                disabled={Boolean(removingId)}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {removingId ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyList;
