import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Film,
  X,
  Tv,
  Layers,
} from "lucide-react";

const AdminSeasons = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  const [seasonNumber, setSeasonNumber] = useState("");

  const [title, setTitle] = useState("");

  // =====================================================
  // FETCH SEASONS
  // =====================================================

  const fetchSeasons = useCallback(async () => {
    console.log("📚 Admin Seasons Series ID:", seriesId);

    if (!seriesId || seriesId === "undefined") {
      setError("Invalid Series ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/seasons/series/${seriesId}`);

      console.log("✅ Seasons Response:", response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to load seasons");
      }

      setSeries(response.data?.series || null);

      const seasonList = Array.isArray(response.data?.seasons)
        ? [...response.data.seasons]
        : [];

      seasonList.sort(
        (a, b) => Number(a.seasonNumber || 0) - Number(b.seasonNumber || 0),
      );

      setSeasons(seasonList);
    } catch (err) {
      console.error(
        "❌ Admin seasons fetch error:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message || err.message || "Failed to load seasons",
      );

      setSeries(null);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setSeasonNumber("");
    setTitle("");
    setEditingSeason(null);
    setShowForm(false);
    setError("");
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const handleAddSeason = () => {
    setEditingSeason(null);
    setError("");

    let nextSeason = 1;

    if (seasons.length > 0) {
      nextSeason =
        Math.max(...seasons.map((item) => Number(item.seasonNumber || 0))) + 1;
    }

    setSeasonNumber(String(nextSeason));
    setTitle("");
    setShowForm(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const handleEditSeason = (season) => {
    setEditingSeason(season);

    setSeasonNumber(String(season.seasonNumber || ""));

    setTitle(season.title || "");

    setError("");
    setShowForm(true);
  };

  // =====================================================
  // SAVE SEASON
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const number = Number(seasonNumber);

    if (!Number.isInteger(number) || number < 1) {
      setError("Season number must be a positive integer");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // ===============================================
      // EDIT
      // ===============================================

      if (editingSeason) {
        const response = await api.patch(`/seasons/${editingSeason.id}`, {
          seasonNumber: number,
          title: title.trim() || null,
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to update season");
        }
      }

      // ===============================================
      // CREATE
      // ===============================================
      else {
        const response = await api.post(`/seasons/series/${seriesId}`, {
          seasonNumber: number,
          title: title.trim() || null,
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to create season");
        }
      }

      resetForm();

      await fetchSeasons();
    } catch (err) {
      console.error(
        "❌ Save season error:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message || err.message || "Failed to save season",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE SEASON
  // =====================================================

  const handleDelete = async (season) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Season ${season.seasonNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(season.id);
      setError("");

      const response = await api.delete(`/seasons/${season.id}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to delete season");
      }

      await fetchSeasons();
    } catch (err) {
      console.error(
        "❌ Delete season error:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message || err.message || "Failed to delete season",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // MANAGE EPISODES
  // =====================================================

  const handleManageEpisodes = (season) => {
    navigate(`/admin/series/${seriesId}/seasons/${season.id}/episodes`);
  };

  // =====================================================
  // TOTAL EPISODES
  // =====================================================

  const getEpisodeCount = (season) => {
    if (season?.totalEpisodes !== undefined && season?.totalEpisodes !== null) {
      return Number(season.totalEpisodes);
    }

    if (season?._count?.episodes !== undefined) {
      return Number(season._count.episodes);
    }

    if (Array.isArray(season?.episodes)) {
      return season.episodes.length;
    }

    return 0;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-full bg-[#08080c] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/series")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
              title="Back to Series"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
              <Layers size={21} className="text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Seasons Manager</h1>

              <p className="mt-0.5 text-sm text-white/40">
                {series?.title || "Manage series seasons"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddSeason}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500"
          >
            <Plus size={18} />
            Add Season
          </button>
        </div>

        {/* =================================================
            SERIES INFO CARD
        ================================================= */}

        {series && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {series.posterUrl ? (
                  <img
                    src={series.posterUrl}
                    alt={series.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Tv size={20} className="text-white/20" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-white">
                  {series.title}
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  {seasons.length} {seasons.length === 1 ? "season" : "seasons"}{" "}
                  available
                </p>
              </div>

              <button
                type="button"
                onClick={fetchSeasons}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-red-300 transition hover:bg-red-500/10 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* =================================================
            ADD / EDIT FORM
        ================================================= */}

        {showForm && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  {editingSeason ? "Edit Season" : "Add New Season"}
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  Configure the season information
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {/* SEASON NUMBER */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Season Number
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={seasonNumber}
                    onChange={(event) => setSeasonNumber(event.target.value)}
                    placeholder="1"
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-500/50"
                    required
                  />
                </div>

                {/* TITLE */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Season Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: The Beginning"
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={17} className="animate-spin" />}

                  {editingSeason ? "Update Season" : "Create Season"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================
            SEASONS
        ================================================= */}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-red-500" />

              <p className="text-sm text-white/40">Loading seasons...</p>
            </div>
          </div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <Film size={30} className="text-red-500" />
              </div>

              <h3 className="text-lg font-semibold">No Seasons Yet</h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
                This series doesn't have any seasons. Create your first season
                to start adding episodes.
              </p>

              <button
                type="button"
                onClick={handleAddSeason}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-500"
              >
                <Plus size={18} />
                Add First Season
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {/* TABLE HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">All Seasons</h2>

                <p className="mt-1 text-xs text-white/40">
                  {seasons.length} {seasons.length === 1 ? "season" : "seasons"}{" "}
                  in this series
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSeason}
                className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white sm:inline-flex"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr className="text-left text-xs uppercase tracking-wider text-white/35">
                    <th className="px-5 py-4 font-medium">Season</th>

                    <th className="px-5 py-4 font-medium">Title</th>

                    <th className="px-5 py-4 font-medium">Episodes</th>

                    <th className="px-5 py-4 font-medium">Created</th>

                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {seasons.map((season) => {
                    const episodeCount = getEpisodeCount(season);

                    const deleting = deletingId === season.id;

                    return (
                      <tr
                        key={season.id}
                        className="border-b border-white/5 transition hover:bg-white/[0.025] last:border-b-0"
                      >
                        {/* SEASON */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-sm font-bold text-red-400">
                              {season.seasonNumber}
                            </div>

                            <div>
                              <p className="font-semibold text-white">
                                Season {season.seasonNumber}
                              </p>

                              <p className="mt-0.5 text-xs text-white/25">
                                {String(season.id).slice(0, 8)}
                                ...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* TITLE */}

                        <td className="px-5 py-4">
                          <p className="max-w-[260px] truncate text-sm text-white/70">
                            {season.title || "Untitled Season"}
                          </p>
                        </td>

                        {/* EPISODES */}

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/60">
                            <Film size={14} className="text-white/30" />

                            {episodeCount}
                          </span>
                        </td>

                        {/* CREATED */}

                        <td className="px-5 py-4">
                          <span className="text-sm text-white/40">
                            {season.createdAt
                              ? new Date(season.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {/* EPISODES */}

                            <button
                              type="button"
                              onClick={() => handleManageEpisodes(season)}
                              className="rounded-lg border border-blue-500/10 bg-blue-500/5 p-2.5 text-blue-400/70 transition hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-400"
                              title="Manage Episodes"
                            >
                              <Film size={17} />
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() => handleEditSeason(season)}
                              className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                              title="Edit Season"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() => handleDelete(season)}
                              disabled={deleting}
                              className="rounded-lg border border-red-500/10 bg-red-500/5 p-2.5 text-red-400/70 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete Season"
                            >
                              {deleting ? (
                                <Loader2 size={17} className="animate-spin" />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSeasons;
