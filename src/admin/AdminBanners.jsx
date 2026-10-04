import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Search,
  X,
  Image,
  Film,
  Tv,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const emptyForm = {
  contentType: "MOVIE",
  movieId: "",
  seriesId: "",
  title: "",
  description: "",
  imageUrl: "",
  buttonText: "Watch Now",
  buttonUrl: "",
  isActive: true,
  sortOrder: 0,
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
  });

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      ...emptyForm,
    });

    setEditingBanner(null);
  };

  // =====================================================
  // FETCH BANNERS
  // =====================================================

  const fetchBanners = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get("/home-banners/admin");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to fetch banners"
          );
        }

        const list =
          response.data?.banners ||
          response.data?.data?.banners ||
          [];

        setBanners(
          Array.isArray(list) ? list : []
        );
      } catch (err) {
        console.error(
          "Fetch banners error:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load banners"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =====================================================
  // FETCH MOVIES
  // =====================================================

  const fetchMovies = useCallback(async () => {
    try {
      const response = await api.get("/movies/admin", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to fetch movies"
        );
      }

      const list =
        response.data?.movies ||
        response.data?.data?.movies ||
        [];

      setMovies(
        Array.isArray(list) ? list : []
      );
    } catch (err) {
      console.error(
        "Fetch movies error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load movies"
      );
    }
  }, []);

  // =====================================================
  // FETCH SERIES
  // =====================================================

  const fetchSeries = useCallback(async () => {
    try {
      const response = await api.get("/series/admin", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to fetch series"
        );
      }

      const list =
        response.data?.series ||
        response.data?.data?.series ||
        [];

      setSeries(
        Array.isArray(list) ? list : []
      );
    } catch (err) {
      console.error(
        "Fetch series error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load series"
      );
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        await Promise.all([
          fetchBanners(),
          fetchMovies(),
          fetchSeries(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
    fetchBanners,
    fetchMovies,
    fetchSeries,
  ]);

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAdd = () => {
    resetForm();
    setError("");
    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEdit = (banner) => {
    const contentType = banner?.movieId
      ? "MOVIE"
      : "SERIES";

    setEditingBanner(banner);

    setForm({
      contentType,
      movieId: banner?.movieId || "",
      seriesId: banner?.seriesId || "",
      title: banner?.title || "",
      description:
        banner?.description || "",
      imageUrl: banner?.imageUrl || "",
      buttonText:
        banner?.buttonText || "Watch Now",
      buttonUrl:
        banner?.buttonUrl || "",
      isActive:
        banner?.isActive ?? true,
      sortOrder:
        Number(banner?.sortOrder) || 0,
    });

    setError("");
    setShowForm(true);
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (actionLoading === "save") {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // CONTENT TYPE
  // =====================================================

  const handleContentType = (type) => {
    setForm((prev) => ({
      ...prev,
      contentType: type,
      movieId: type === "MOVIE"
        ? prev.movieId
        : "",
      seriesId: type === "SERIES"
        ? prev.seriesId
        : "",
    }));
  };

  // =====================================================
  // SELECT CONTENT
  // =====================================================

  const handleContentSelect = (id) => {
    if (form.contentType === "MOVIE") {
      setForm((prev) => ({
        ...prev,
        movieId: id,
        seriesId: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        seriesId: id,
        movieId: "",
      }));
    }
  };

  // =====================================================
  // AUTO FILL IMAGE / URL
  // =====================================================

  const handleContentAutoFill = (id) => {
    if (!id) return;

    if (form.contentType === "MOVIE") {
      const movie = movies.find(
        (item) => item.id === id
      );

      if (!movie) return;

      setForm((prev) => ({
        ...prev,
        movieId: movie.id,
        seriesId: "",
        imageUrl:
          prev.imageUrl ||
          movie.backdropUrl ||
          movie.posterUrl ||
          "",
        title: prev.title || movie.title || "",
        description:
          prev.description ||
          movie.description ||
          "",
        buttonUrl:
          prev.buttonUrl ||
          "/movie/" + movie.id,
      }));
    } else {
      const item = series.find(
        (item) => item.id === id
      );

      if (!item) return;

      setForm((prev) => ({
        ...prev,
        seriesId: item.id,
        movieId: "",
        imageUrl:
          prev.imageUrl ||
          item.backdropUrl ||
          item.posterUrl ||
          "",
        title: prev.title || item.title || "",
        description:
          prev.description ||
          item.description ||
          "",
        buttonUrl:
          prev.buttonUrl ||
          "/series/" + item.id,
      }));
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading("save");
      setError("");

      if (form.contentType === "MOVIE" && !form.movieId) {
        throw new Error(
          "Please select a movie"
        );
      }

      if (
        form.contentType === "SERIES" &&
        !form.seriesId
      ) {
        throw new Error(
          "Please select a series"
        );
      }

      if (!form.imageUrl.trim()) {
        throw new Error(
          "Banner image URL is required"
        );
      }

      const payload = {
        movieId:
          form.contentType === "MOVIE"
            ? form.movieId
            : null,

        seriesId:
          form.contentType === "SERIES"
            ? form.seriesId
            : null,

        title:
          form.title.trim() || null,

        description:
          form.description.trim() || null,

        imageUrl:
          form.imageUrl.trim(),

        buttonText:
          form.buttonText.trim() ||
          "Watch Now",

        buttonUrl:
          form.buttonUrl.trim() || null,

        isActive:
          Boolean(form.isActive),

        sortOrder:
          Number(form.sortOrder) || 0,
      };

      if (editingBanner) {
        await api.patch(`/home-banners/${editingBanner.id}`, payload);
      } else {
        await api.post("/home-banners", payload);
      }

      setShowForm(false);
      resetForm();

      await fetchBanners(true);
    } catch (err) {
      console.error(
        "Save banner error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save banner"
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (banner) => {
    const title =
      banner?.title ||
      banner?.movie?.title ||
      banner?.series?.title ||
      "this banner";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(
        "delete-" + banner.id
      );
      setError("");

      await api.delete(`/home-banners/${banner.id}`);

      await fetchBanners(true);
    } catch (err) {
      console.error(
        "Delete banner error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete banner"
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // TOGGLE ACTIVE
  // =====================================================

  const handleToggle = async (banner) => {
    try {
      setActionLoading(
        "toggle-" + banner.id
      );
      setError("");

      await api.patch(`/home-banners/${banner.id}`, {
        movieId: banner.movieId || null,
        seriesId: banner.seriesId || null,
        isActive: !banner.isActive,
      });

      await fetchBanners(true);
    } catch (err) {
      console.error(
        "Toggle banner error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update banner"
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredBanners = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return banners;
    }

    return banners.filter((banner) => {
      const title =
        banner?.title ||
        banner?.movie?.title ||
        banner?.series?.title ||
        "";

      return title
        .toLowerCase()
        .includes(query);
    });
  }, [banners, search]);

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount = banners.filter(
    (banner) => banner.isActive
  ).length;

  const movieBannerCount = banners.filter(
    (banner) => banner.movieId
  ).length;

  const seriesBannerCount = banners.filter(
    (banner) => banner.seriesId
  ).length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-[100dvh] w-full bg-[#090909] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#090909]/95 backdrop-blur-xl">
        <div className="px-5 sm:px-7 lg:px-8 py-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Image
                  size={21}
                  className="text-red-500"
                />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Home Banners
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage Cinevo homepage hero banners
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  fetchBanners(true)
                }
                disabled={refreshing}
                title="Refresh"
                className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? "animate-spin text-gray-500"
                      : "text-gray-300"
                  }
                />
              </button>

              <button
                type="button"
                onClick={openAdd}
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/10 transition"
              >
                <Plus size={18} />
                Add Banner
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="min-h-[calc(100dvh-89px)] bg-[#090909] px-4 sm:px-6 lg:px-8 py-5 sm:py-6">

        <div className="max-w-[1600px] mx-auto">

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5 flex items-start gap-3">

              <p className="text-sm text-red-400 flex-1">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="text-gray-500 hover:text-white"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Total Banners
              </p>

              <p className="text-2xl font-bold mt-2">
                {banners.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Active
              </p>

              <p className="text-2xl font-bold mt-2 text-emerald-400">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Movie Banners
              </p>

              <p className="text-2xl font-bold mt-2">
                {movieBannerCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">
                Series Banners
              </p>

              <p className="text-2xl font-bold mt-2">
                {seriesBannerCount}
              </p>
            </div>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-3 mb-5">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search banners..."
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              BANNERS
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] overflow-hidden">

            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

              <div>
                <h2 className="font-semibold">
                  All Banners
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {filteredBanners.length} banners found
                </p>
              </div>

            </div>

            {loading ? (

              <div className="min-h-[420px] flex flex-col items-center justify-center">
                <Loader2
                  size={28}
                  className="animate-spin text-red-500"
                />

                <p className="mt-3 text-sm text-gray-500">
                  Loading banners...
                </p>
              </div>

            ) : filteredBanners.length === 0 ? (

              <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-5">

                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                  <Image
                    size={28}
                    className="text-gray-600"
                  />
                </div>

                <h3 className="text-lg font-semibold">
                  No banners found
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {search
                    ? "No banner matches your search."
                    : "Create your first homepage banner."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="mt-5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Banner
                  </button>
                )}

              </div>

            ) : (

              <div className="divide-y divide-white/[0.05]">

                {filteredBanners.map(
                  (banner) => {

                    const title =
                      banner?.title ||
                      banner?.movie?.title ||
                      banner?.series?.title ||
                      "Untitled Banner";

                    const contentTitle =
                      banner?.movie?.title ||
                      banner?.series?.title ||
                      "Unknown";

                    const isMovie =
                      Boolean(
                        banner?.movieId
                      );

                    const toggleLoading =
                      actionLoading ===
                      "toggle-" +
                        banner.id;

                    const deleteLoading =
                      actionLoading ===
                      "delete-" +
                        banner.id;

                    return (
                      <div
                        key={banner.id}
                        className="p-4 sm:p-5 hover:bg-white/[0.018] transition"
                      >

                        <div className="flex flex-col xl:flex-row gap-4">

                          {/* IMAGE */}

                          <div className="w-full xl:w-[320px] h-40 sm:h-48 xl:h-36 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">

                            {banner.imageUrl ? (
                              <img
                                src={
                                  banner.imageUrl
                                }
                                alt={title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image
                                  size={30}
                                  className="text-gray-700"
                                />
                              </div>
                            )}

                          </div>

                          {/* INFO */}

                          <div className="flex-1 min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/10 text-[10px] font-semibold text-red-400">
                                {isMovie
                                  ? "MOVIE"
                                  : "SERIES"}
                              </span>

                              <span
                                className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${
                                  banner.isActive
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-gray-500/10 border-gray-500/20 text-gray-500"
                                }`}
                              >
                                {banner.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>

                            </div>

                            <h3 className="text-lg font-semibold mt-2 truncate">
                              {title}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1">
                              Content:{" "}
                              <span className="text-gray-300">
                                {contentTitle}
                              </span>
                            </p>

                            {banner.description && (
                              <p className="text-sm text-gray-500 mt-3 line-clamp-2 max-w-3xl">
                                {banner.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 mt-4">

                              <span className="text-xs text-gray-500">
                                Order:{" "}
                                <span className="text-gray-300">
                                  {banner.sortOrder ?? 0}
                                </span>
                              </span>

                              {banner.buttonText && (
                                <span className="text-xs text-gray-500">
                                  Button:{" "}
                                  <span className="text-gray-300">
                                    {banner.buttonText}
                                  </span>
                                </span>
                              )}

                            </div>

                          </div>

                          {/* ACTIONS */}

                          <div className="flex xl:flex-col gap-2 xl:justify-center">

                            <button
                              type="button"
                              title={
                                banner.isActive
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              onClick={() =>
                                handleToggle(
                                  banner
                                )
                              }
                              disabled={
                                toggleLoading
                              }
                              className="h-10 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 text-gray-400 flex items-center justify-center gap-2 transition"
                            >
                              {toggleLoading ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : banner.isActive ? (
                                <EyeOff
                                  size={16}
                                />
                              ) : (
                                <Eye
                                  size={16}
                                />
                              )}

                              <span className="text-xs">
                                {banner.isActive
                                  ? "Hide"
                                  : "Show"}
                              </span>
                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                openEdit(
                                  banner
                                )
                              }
                              className="h-10 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-yellow-500/10 hover:border-yellow-500/20 hover:text-yellow-400 text-gray-400 flex items-center justify-center gap-2 transition"
                            >
                              <Pencil size={16} />
                              <span className="text-xs">
                                Edit
                              </span>
                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  banner
                                )
                              }
                              disabled={
                                deleteLoading
                              }
                              className="h-10 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                              {deleteLoading ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}

                              <span className="text-xs">
                                Delete
                              </span>
                            </button>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </div>
      </main>

      {/* =================================================
          MODAL
      ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">

          <div
            className="absolute inset-0"
            onClick={closeForm}
          />

          <div className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 px-5 py-4 border-b border-white/[0.06] bg-[#111111]/95 backdrop-blur-xl flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  {editingBanner
                    ? "Edit Banner"
                    : "Add Home Banner"}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Configure homepage hero content
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-5"
            >

              {/* CONTENT TYPE */}

              <div>

                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Content Type
                </label>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      handleContentType(
                        "MOVIE"
                      )
                    }
                    className={`h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                      form.contentType ===
                      "MOVIE"
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Film size={17} />
                    Movie
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleContentType(
                        "SERIES"
                      )
                    }
                    className={`h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                      form.contentType ===
                      "SERIES"
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Tv size={17} />
                    Series
                  </button>

                </div>

              </div>

              {/* CONTENT */}

              <div>

                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Select{" "}
                  {form.contentType ===
                  "MOVIE"
                    ? "Movie"
                    : "Series"}
                </label>

                <select
                  value={
                    form.contentType ===
                    "MOVIE"
                      ? form.movieId
                      : form.seriesId
                  }
                  onChange={(e) => {
                    handleContentSelect(
                      e.target.value
                    );
                    handleContentAutoFill(
                      e.target.value
                    );
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-[#181818] text-white outline-none focus:border-red-500/40"
                >

                  <option value="">
                    Select{" "}
                    {form.contentType ===
                    "MOVIE"
                      ? "movie"
                      : "series"}
                  </option>

                  {form.contentType ===
                  "MOVIE"
                    ? movies.map(
                        (movie) => (
                          <option
                            key={movie.id}
                            value={movie.id}
                          >
                            {movie.title}
                          </option>
                        )
                      )
                    : series.map(
                        (item) => (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.title}
                          </option>
                        )
                      )}

                </select>

                <p className="text-[11px] text-gray-600 mt-2">
                  Select the content that this banner will promote.
                </p>

              </div>

              {/* IMAGE URL */}

              <div>

                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Banner Image URL
                  <span className="text-red-400 ml-1">
                    *
                  </span>
                </label>

                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      imageUrl:
                        e.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10"
                />

                {form.imageUrl && (
                  <div className="mt-3 h-36 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <img
                      src={
                        form.imageUrl
                      }
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

              </div>

              {/* TITLE */}

              <div>

                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Custom Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title:
                        e.target.value,
                    }))
                  }
                  placeholder="Optional — uses movie/series title by default"
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Custom Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description:
                        e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional — uses movie/series description by default"
                  className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 resize-none"
                />

              </div>

              {/* BUTTON ROW */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Button Text
                  </label>

                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        buttonText:
                          e.target.value,
                      }))
                    }
                    placeholder="Watch Now"
                    className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Button URL
                  </label>

                  <input
                    type="text"
                    value={form.buttonUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        buttonUrl:
                          e.target.value,
                      }))
                    }
                    placeholder="/movie/..."
                    className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40"
                  />
                </div>

              </div>

              {/* ORDER + ACTIVE */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder:
                          e.target.value,
                      }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white outline-none focus:border-red-500/40"
                  />

                  <p className="text-[11px] text-gray-600 mt-2">
                    Lower number appears first.
                  </p>
                </div>

                <div>

                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Visibility
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive:
                          !prev.isActive,
                      }))
                    }
                    className={`w-full h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                      form.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.03] border-white/10 text-gray-500"
                    }`}
                  >
                    {form.isActive ? (
                      <>
                        <Eye size={17} />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff size={17} />
                        Hidden
                      </>
                    )}
                  </button>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-white/[0.06]">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={
                    actionLoading === "save"
                  }
                  className="h-11 px-5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    actionLoading ===
                    "save"
                  }
                  className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {actionLoading ===
                  "save" && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingBanner
                    ? "Update Banner"
                    : "Create Banner"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      <div className="h-6 bg-[#090909]" />
    </div>
  );
};

export default AdminBanners;
