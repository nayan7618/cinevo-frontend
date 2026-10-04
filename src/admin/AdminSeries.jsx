import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  ChevronDown,
  Tv,
  Layers,
  X,
  PlayCircle,
  Film,
} from "lucide-react";

import AdminAddSeries from "./AdminAddSeries";
import AdminEditSeries from "./AdminEditSeries";

// ======================================================
// DARK SELECT
// ======================================================
const DarkSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-left flex items-center justify-between transition"
      >
        <span className={selected ? "text-white" : "text-gray-500"}>
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`text-gray-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 mt-2 z-40 rounded-xl border border-white/10 bg-[#151515] shadow-2xl overflow-hidden">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-sm transition
                  ${
                    option.value === value
                      ? "bg-red-500/15 text-red-400"
                      : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


// ======================================================
// HELPERS
// ======================================================
const getSeasonCount = (item) => {
  if (Number.isFinite(Number(item?.totalSeasons))) {
    return Number(item.totalSeasons);
  }

  if (Array.isArray(item?.seasons)) {
    return item.seasons.length;
  }

  return 0;
};

const getEpisodeCount = (item) => {
  if (Number.isFinite(Number(item?.totalEpisodes))) {
    return Number(item.totalEpisodes);
  }

  if (Array.isArray(item?.seasons)) {
    return item.seasons.reduce(
      (total, season) =>
        total + Number(season?._count?.episodes || 0),
      0
    );
  }

  return 0;
};

const formatYear = (year) => {
  return year ? year : "—";
};

const getStatusClass = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PUBLISHED") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
};


// ======================================================
// MAIN
// ======================================================
const AdminSeries = () => {
  const navigate = useNavigate();

  const debounceRef = useRef(null);

  const [series, setSeries] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalSeries: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");

  const [showAddSeries, setShowAddSeries] = useState(false);
  const [editSeries, setEditSeries] = useState(null);


  // ======================================================
  // FETCH SERIES
  // ======================================================
  const fetchSeries = useCallback(
  async (page = 1, showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = {
        page,
        limit: pagination.limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      const response = await api.get("/series/admin", {
        params,
      });

      console.log("ADMIN SERIES RESPONSE:", response.data);

      const data = response.data;

      if (!data?.success) {
        throw new Error(
          data?.message || "Failed to fetch series"
        );
      }

      // ✅ IMPORTANT
      const seriesList =
        data?.series ||
        data?.data?.series ||
        [];

      setSeries(Array.isArray(seriesList) ? seriesList : []);

      setPagination(
        data?.pagination ||
          data?.data?.pagination || {
            page,
            limit: pagination.limit,
            totalSeries: seriesList.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }
      );
    } catch (err) {
      console.error(
        "Admin series fetch error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load series"
      );

      setSeries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [pagination.limit, search, status]
);


  // ======================================================
  // DEBOUNCE SEARCH
  // ======================================================
  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSeries(1);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [search, status, fetchSeries]);


  // ======================================================
  // INITIAL LOAD
  // ======================================================
  useEffect(() => {
    fetchSeries(1);
  }, []);


  // ======================================================
  // PUBLISH
  // ======================================================
  const handlePublish = async (id) => {
    try {
      setActionLoading(`publish-${id}`);
      setError("");

      await api.patch(`/series/${id}/publish`, {});

      await fetchSeries(pagination.page, true);
    } catch (err) {
      console.error("Publish series error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to publish series"
      );
    } finally {
      setActionLoading("");
    }
  };


  // ======================================================
  // DELETE
  // ======================================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this series?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${id}`);
      setError("");

      await api.delete(`/series/${id}`);

      const newPage =
        series.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await fetchSeries(newPage, true);
    } catch (err) {
      console.error("Delete series error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete series"
      );
    } finally {
      setActionLoading("");
    }
  };


  // ======================================================
  // STATS
  // ======================================================
  const totalSeries = pagination.totalSeries || 0;

  const publishedCount = series.filter(
    (item) =>
      String(item.status).toUpperCase() === "PUBLISHED"
  ).length;

  const draftCount = series.filter(
    (item) =>
      String(item.status).toUpperCase() === "DRAFT"
  ).length;

  const episodeCount = series.reduce(
    (total, item) => total + getEpisodeCount(item),
    0
  );


  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="min-h-full bg-[#090909] text-white">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="sticky top-0 z-20 bg-[#090909]/95 backdrop-blur-xl border-b border-white/[0.06]">

        <div className="px-5 sm:px-7 lg:px-8 py-5">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Tv
                    size={22}
                    className="text-red-500"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Series
                  </h1>

                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage your TV shows and web series
                  </p>
                </div>
              </div>
            </div>


            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  fetchSeries(
                    pagination.page,
                    true
                  )
                }
                disabled={refreshing}
                className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
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
                onClick={() =>
                  setShowAddSeries(true)
                }
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/10 transition"
              >
                <Plus size={18} />
                Add Series
              </button>

            </div>

          </div>
        </div>
      </div>


      {/* ==================================================
          CONTENT
      ================================================== */}
      <div className="px-5 sm:px-7 lg:px-8 py-6">

        {/* ==================================================
            ERROR
        ================================================== */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">

            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-gray-500 hover:text-white transition"
            >
              <X size={17} />
            </button>

          </div>
        )}


        {/* ==================================================
            STAT CARDS
        ================================================== */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">

          {/* TOTAL */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Total Series
                </p>

                <p className="text-2xl font-bold mt-2">
                  {totalSeries}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                <Tv
                  size={19}
                  className="text-gray-300"
                />
              </div>

            </div>
          </div>


          {/* PUBLISHED */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Published
                </p>

                <p className="text-2xl font-bold mt-2">
                  {publishedCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check
                  size={19}
                  className="text-emerald-400"
                />
              </div>

            </div>
          </div>


          {/* DRAFT */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Draft
                </p>

                <p className="text-2xl font-bold mt-2">
                  {draftCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Pencil
                  size={18}
                  className="text-yellow-400"
                />
              </div>

            </div>
          </div>


          {/* EPISODES */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Episodes
                </p>

                <p className="text-2xl font-bold mt-2">
                  {episodeCount}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <PlayCircle
                  size={19}
                  className="text-blue-400"
                />
              </div>

            </div>
          </div>

        </div>


        {/* ==================================================
            FILTER BAR
        ================================================== */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 mb-5">

          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}
            <div className="relative flex-1">

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
                placeholder="Search series by title..."
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              )}

            </div>


            {/* STATUS */}
            <div className="w-full md:w-48">
              <DarkSelect
                value={status}
                onChange={setStatus}
                placeholder="All Status"
                options={[
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
                ]}
              />
            </div>

          </div>
        </div>


        {/* ==================================================
            TABLE
        ================================================== */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

          {/* TABLE HEADER */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-white">
                All Series
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                {pagination.totalSeries || 0} series found
              </p>
            </div>

          </div>


          {/* LOADING */}
          {loading ? (
            <div className="h-[450px] flex flex-col items-center justify-center">

              <Loader2
                size={30}
                className="animate-spin text-red-500"
              />

              <p className="mt-3 text-sm text-gray-500">
                Loading series...
              </p>

            </div>
          ) : series.length === 0 ? (

            /* EMPTY */
            <div className="h-[450px] flex flex-col items-center justify-center px-5 text-center">

              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <Tv
                  size={28}
                  className="text-gray-600"
                />
              </div>

              <h3 className="text-lg font-semibold">
                No series found
              </h3>

              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                No series matches the current search or filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
                className="mt-5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm transition"
              >
                Clear Filters
              </button>

            </div>
          ) : (

            <>
              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Series
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Category
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Genres
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Seasons
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Episodes
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">
                        Actions
                      </th>

                    </tr>
                  </thead>


                  <tbody>
                    {series.map((item) => {

                      const seasonCount =
                        getSeasonCount(item);

                      const episodeCount =
                        getEpisodeCount(item);

                      const isPublished =
                        String(item.status).toUpperCase() ===
                        "PUBLISHED";

                      const genres =
                        Array.isArray(item.genres)
                          ? item.genres
                          : [];

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-white/[0.045] hover:bg-white/[0.025] transition"
                        >

                          {/* SERIES */}
                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3 min-w-[280px]">

                              <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/[0.05] border border-white/[0.08] shrink-0">

                                {item.posterUrl ? (
                                  <img
                                    src={item.posterUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Film
                                      size={18}
                                      className="text-gray-600"
                                    />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <div className="flex items-center gap-2">

                                  <p className="font-semibold text-sm text-white truncate max-w-[230px]">
                                    {item.title}
                                  </p>

                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  {formatYear(item.releaseYear)}
                                  {item.language
                                    ? ` • ${item.language}`
                                    : ""}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* CATEGORY */}
                          <td className="px-5 py-4">

                            <span className="text-sm text-gray-300">
                              {item.category?.name || "—"}
                            </span>

                          </td>


                          {/* GENRES */}
                          <td className="px-5 py-4">

                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">

                              {genres.length > 0 ? (
                                genres
                                  .slice(0, 3)
                                  .map((genreItem) => (
                                    <span
                                      key={
                                        genreItem.genreId ||
                                        genreItem.id
                                      }
                                      className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.06] text-[11px] text-gray-400"
                                    >
                                      {genreItem.genre?.name ||
                                        genreItem.name ||
                                        "Genre"}
                                    </span>
                                  ))
                              ) : (
                                <span className="text-sm text-gray-600">
                                  —
                                </span>
                              )}

                              {genres.length > 3 && (
                                <span className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.06] text-[11px] text-gray-500">
                                  +{genres.length - 3}
                                </span>
                              )}

                            </div>

                          </td>


                          {/* SEASONS */}
                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2 text-sm">

                              <Layers
                                size={16}
                                className="text-gray-500"
                              />

                              <span>
                                {seasonCount}
                              </span>

                            </div>

                          </td>


                          {/* EPISODES */}
                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2 text-sm">

                              <PlayCircle
                                size={16}
                                className="text-gray-500"
                              />

                              <span>
                                {episodeCount}
                              </span>

                            </div>

                          </td>


                          {/* STATUS */}
                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold ${getStatusClass(
                                item.status
                              )}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPublished
                                    ? "bg-emerald-400"
                                    : "bg-yellow-400"
                                }`}
                              />

                              {String(
                                item.status || "DRAFT"
                              ).toUpperCase()}
                            </span>

                          </td>


                          {/* ACTIONS */}
                          <td className="px-5 py-4">

                            <div className="flex items-center justify-end gap-1.5">

                              {/* MANAGE SEASONS */}
                              <button
                                type="button"
                                title="Manage Seasons"
                                onClick={() => {
                                  if (!item?.id) {
                                    setError(
                                      "Series ID is missing"
                                    );
                                    return;
                                  }

                                  navigate(
                                    `/admin/series/${item.id}/seasons`
                                  );
                                }}
                                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 text-gray-400 flex items-center justify-center transition"
                              >
                                <Layers size={17} />
                              </button>


                              {/* EDIT */}
                              <button
                                type="button"
                                title="Edit Series"
                                onClick={() =>
                                  setEditSeries(item)
                                }
                                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-yellow-500/10 hover:border-yellow-500/20 hover:text-yellow-400 text-gray-400 flex items-center justify-center transition"
                              >
                                <Pencil size={17} />
                              </button>


                              {/* PUBLISH */}
                              {!isPublished && (
                                <button
                                  type="button"
                                  title="Publish Series"
                                  onClick={() =>
                                    handlePublish(item.id)
                                  }
                                  disabled={
                                    actionLoading ===
                                    `publish-${item.id}`
                                  }
                                  className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 text-gray-400 flex items-center justify-center transition disabled:opacity-50"
                                >
                                  {actionLoading ===
                                  `publish-${item.id}` ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check size={17} />
                                  )}
                                </button>
                              )}


                              {/* DELETE */}
                              <button
                                type="button"
                                title="Delete Series"
                                onClick={() =>
                                  handleDelete(item.id)
                                }
                                disabled={
                                  actionLoading ===
                                  `delete-${item.id}`
                                }
                                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition disabled:opacity-50"
                              >
                                {actionLoading ===
                                `delete-${item.id}` ? (
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={17} />
                                )}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>

              </div>


              {/* ==================================================
                  MOBILE / TABLET CARDS
              ================================================== */}
              <div className="lg:hidden divide-y divide-white/[0.06]">

                {series.map((item) => {

                  const seasonCount =
                    getSeasonCount(item);

                  const episodeCount =
                    getEpisodeCount(item);

                  const isPublished =
                    String(item.status).toUpperCase() ===
                    "PUBLISHED";

                  return (
                    <div
                      key={item.id}
                      className="p-4"
                    >

                      <div className="flex gap-3">

                        {/* POSTER */}
                        <div className="w-16 h-22 rounded-lg overflow-hidden bg-white/[0.05] border border-white/[0.08] shrink-0">

                          {item.posterUrl ? (
                            <img
                              src={item.posterUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film
                                size={20}
                                className="text-gray-600"
                              />
                            </div>
                          )}

                        </div>


                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <h3 className="font-semibold text-sm truncate">
                                {item.title}
                              </h3>

                              <p className="text-xs text-gray-500 mt-1">
                                {item.category?.name ||
                                  "No category"}
                                {item.releaseYear
                                  ? ` • ${item.releaseYear}`
                                  : ""}
                              </p>

                            </div>

                            <span
                              className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${getStatusClass(
                                item.status
                              )}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPublished
                                    ? "bg-emerald-400"
                                    : "bg-yellow-400"
                                }`}
                              />

                              {isPublished
                                ? "LIVE"
                                : "DRAFT"}
                            </span>

                          </div>


                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">

                            <span className="flex items-center gap-1.5">
                              <Layers size={14} />
                              {seasonCount} seasons
                            </span>

                            <span className="flex items-center gap-1.5">
                              <PlayCircle size={14} />
                              {episodeCount} episodes
                            </span>

                          </div>

                        </div>

                      </div>


                      {/* MOBILE ACTIONS */}
                      <div className="grid grid-cols-4 gap-2 mt-4">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/series/${item.id}/seasons`
                            )
                          }
                          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:text-blue-400 text-gray-400 flex items-center justify-center transition"
                        >
                          <Layers size={17} />
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            setEditSeries(item)
                          }
                          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-yellow-500/10 hover:text-yellow-400 text-gray-400 flex items-center justify-center transition"
                        >
                          <Pencil size={17} />
                        </button>


                        <button
                          type="button"
                          disabled={isPublished}
                          onClick={() =>
                            handlePublish(item.id)
                          }
                          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-400 flex items-center justify-center transition disabled:opacity-30"
                        >
                          <Check size={17} />
                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-400 text-gray-400 flex items-center justify-center transition"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </div>
                  );
                })}

              </div>

            </>
          )}


          {/* ==================================================
              PAGINATION
          ================================================== */}
          {!loading && series.length > 0 && (
            <div className="px-5 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <p className="text-xs text-gray-500">
                Page{" "}
                <span className="text-gray-300 font-medium">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="text-gray-300 font-medium">
                  {pagination.totalPages || 1}
                </span>
              </p>


              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage ||
                    loading
                  }
                  onClick={() =>
                    fetchSeries(
                      pagination.page - 1,
                      true
                    )
                  }
                  className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm text-gray-300 transition"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>


                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage ||
                    loading
                  }
                  onClick={() =>
                    fetchSeries(
                      pagination.page + 1,
                      true
                    )
                  }
                  className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm text-gray-300 transition"
                >
                  Next
                  <ChevronRight size={16} />
                </button>

              </div>

            </div>
          )}

        </div>

      </div>


      {/* ==================================================
          ADD SERIES MODAL
      ================================================== */}
      {showAddSeries && (
        <AdminAddSeries
          onClose={() =>
            setShowAddSeries(false)
          }
          onSeriesCreated={() => {
            setShowAddSeries(false);
            fetchSeries(
              pagination.page,
              true
            );
          }}
        />
      )}


      {/* ==================================================
          EDIT SERIES MODAL
      ================================================== */}
      {editSeries && (
        <AdminEditSeries
          series={editSeries}
          onClose={() =>
            setEditSeries(null)
          }
          onSeriesUpdated={() => {
            setEditSeries(null);
            fetchSeries(
              pagination.page,
              true
            );
          }}
        />
      )}

    </div>
  );
};

export default AdminSeries;