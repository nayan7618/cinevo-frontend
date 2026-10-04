import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import api from "../services/api";

import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  RefreshCw,
  PlayCircle,
  Film,
  X,
  Check,
  Clock3,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Ban,
} from "lucide-react";


const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

const AdminEpisodes = () => {
  const navigate = useNavigate();

  const { seriesId, seasonId } = useParams();

  const [season, setSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const [formLoading, setFormLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(null);

  const [videoUploading, setVideoUploading] = useState(null);

  const [videoProgress, setVideoProgress] = useState(0);

  const [thumbnailUploading, setThumbnailUploading] = useState(null);

  const [publishingEpisode, setPublishingEpisode] = useState(null);

  const [unpublishingEpisode, setUnpublishingEpisode] = useState(null);

  const [form, setForm] = useState({
    episodeNumber: "",
    title: "",
    description: "",
    duration: "",
  });

  const fileRef = useRef(null);

  const thumbnailFileRef = useRef(null);

  // One controller per upload
  const uploadControllersRef = useRef(new Map());

  // =====================================================
  // FETCH EPISODES
  // =====================================================

  const fetchEpisodes = useCallback(
    async (showRefresh = false) => {
      if (!seasonId) {
        setError("Season ID is missing");
        setLoading(false);
        return;
      }

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(`/episodes/season/${seasonId}`);

        const list =
          response.data?.episodes ||
          response.data?.data?.episodes ||
          response.data?.data ||
          [];

        const normalized = Array.isArray(list) ? [...list] : [];

        normalized.sort(
          (a, b) => Number(a.episodeNumber || 0) - Number(b.episodeNumber || 0),
        );

        setEpisodes(normalized);

        setSeason(
          response.data?.season ||
            response.data?.data?.season ||
            response.data?.series?.season ||
            null,
        );
      } catch (err) {
        console.error("Admin episodes fetch error:", err.response?.data || err);

        setError(err.response?.data?.message || "Failed to load episodes");

        setEpisodes([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [seasonId],
  );

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      episodeNumber: "",
      title: "",
      description: "",
      duration: "",
    });

    setEditingEpisode(null);
  };

  // =====================================================
  // ADD EPISODE
  // =====================================================

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // =====================================================
  // EDIT EPISODE
  // =====================================================

  const openEditForm = (episode) => {
    setEditingEpisode(episode);

    setForm({
      episodeNumber: episode?.episodeNumber ?? "",
      title: episode?.title || "",
      description: episode?.description || "",
      duration: episode?.duration ?? "",
    });

    setShowForm(true);
  };

  // =====================================================
  // SUBMIT EPISODE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setError("");

      if (!seasonId) {
        throw new Error("Season ID is missing");
      }

      const payload = {
        episodeNumber: Number(form.episodeNumber),
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration: form.duration === "" ? null : Number(form.duration),
      };

      if (!payload.episodeNumber) {
        throw new Error("Episode number is required");
      }

      if (!payload.title) {
        throw new Error("Episode title is required");
      }

      if (editingEpisode) {
        await api.patch(`/episodes/${editingEpisode.id}`, payload);
      } else {
        await api.post(`/episodes/season/${seasonId}`, payload);
      }

      setShowForm(false);
      resetForm();

      await fetchEpisodes(true);
    } catch (err) {
      console.error("Save episode error:", err.response?.data || err);

      setError(
        err.response?.data?.message || err.message || "Failed to save episode",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =====================================================
  // DELETE EPISODE
  // =====================================================

  const handleDelete = async (episode) => {
    const confirmed = window.confirm(`Delete "${episode.title}"?`);

    if (!confirmed) return;

    try {
      setDeleteLoading(episode.id);
      setError("");

      await api.delete(`/episodes/${episode.id}`);

      await fetchEpisodes(true);
    } catch (err) {
      console.error("Delete episode error:", err.response?.data || err);

      setError(err.response?.data?.message || "Failed to delete episode");
    } finally {
      setDeleteLoading(null);
    }
  };

  // =====================================================
  // PUBLISH EPISODE
  // =====================================================

  const handlePublishEpisode = async (episode) => {
    if (!episode?.id) return;

    if (String(episode?.video?.status || "").toUpperCase() !== "READY") {
      setError("Episode video must be READY before publishing");
      return;
    }

    try {
      setPublishingEpisode(episode.id);
      setError("");

      await api.patch(`/episodes/${episode.id}/publish`, {});

      await fetchEpisodes(true);
    } catch (err) {
      console.error("Publish episode error:", err.response?.data || err);

      setError(err.response?.data?.message || "Failed to publish episode");
    } finally {
      setPublishingEpisode(null);
    }
  };

  // =====================================================
  // UNPUBLISH EPISODE
  // =====================================================

  const handleUnpublishEpisode = async (episode) => {
    if (!episode?.id) return;

    try {
      setUnpublishingEpisode(episode.id);

      setError("");

      await api.patch(`/episodes/${episode.id}/unpublish`, {});

      await fetchEpisodes(true);
    } catch (err) {
      console.error("Unpublish episode error:", err.response?.data || err);

      setError(err.response?.data?.message || "Failed to unpublish episode");
    } finally {
      setUnpublishingEpisode(null);
    }
  };

  // =====================================================
  // CREATE UPLOAD CONTROLLER
  // =====================================================

  const createUploadController = (episodeId) => {
    const controller = new AbortController();

    uploadControllersRef.current.set(episodeId, controller);

    return controller;
  };

  const removeUploadController = (episodeId) => {
    uploadControllersRef.current.delete(episodeId);
  };

  // =====================================================
  // CANCEL VIDEO / THUMBNAIL UPLOAD
  // =====================================================

  const handleCancelUpload = (episodeId) => {
    const controller = uploadControllersRef.current.get(episodeId);

    if (controller) {
      controller.abort();
    }

    uploadControllersRef.current.delete(episodeId);
  };

  // =====================================================
  // HANDLE VIDEO UPLOAD / REPLACE
  // =====================================================

  const handleVideoUpload = async (episode, file) => {
    if (!file || !episode?.id) return;

    const episodeId = episode.id;

    try {
      setVideoUploading(episodeId);

      setVideoProgress(0);
      setError("");

      // -------------------------------------------------
      // CONTROLLER
      // -------------------------------------------------

      const controller = createUploadController(episodeId);

      // -------------------------------------------------
      // 1. GET PRESIGNED URL
      // -------------------------------------------------

      const uploadResponse = await api.post("/uploads/episode-video", {
        episodeId,
        fileName: file.name,
        contentType: file.type,
      });

      const uploadUrl = uploadResponse.data?.uploadUrl;

      const storageKey = uploadResponse.data?.key;

      if (!uploadUrl || !storageKey) {
        throw new Error("Upload URL was not generated");
      }

      // -------------------------------------------------
      // 2. DIRECT R2 UPLOAD
      // -------------------------------------------------

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },

        signal: controller.signal,

        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }

          const percent = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100,
          );

          setVideoProgress(percent);
        },
      });

      // -------------------------------------------------
      // 3. CREATE OR REPLACE VIDEO
      // -------------------------------------------------

      if (episode.video) {
        await api.post(`/videos/episode/${episodeId}/replace`, {
            storageKey,
            duration: episode.duration || null,
            quality: "FULL_HD",
          });
      } else {
        await api.post("/videos", {
            episodeId,
            storageKey,
            duration: episode.duration || null,
            quality: "FULL_HD",
          });
      }

      await fetchEpisodes(true);
    } catch (err) {
      if (err?.code === "ERR_CANCELED") {
        setError("Video upload cancelled");
      } else if (err?.name === "CanceledError") {
        setError("Video upload cancelled");
      } else {
        console.error("Episode video upload error:", err.response?.data || err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to upload/replace episode video",
        );
      }
    } finally {
      removeUploadController(episodeId);

      setVideoUploading(null);
      setVideoProgress(0);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  // =====================================================
  // SELECT VIDEO FILE
  // =====================================================

  const selectVideoFile = (episode) => {
    if (!episode?.id) return;

    const input = document.createElement("input");

    input.type = "file";

    input.accept = "video/mp4,video/webm,video/quicktime";

    input.onchange = (event) => {
      const file = event.target.files?.[0];

      if (file) {
        handleVideoUpload(episode, file);
      }
    };

    fileRef.current = input;

    input.click();
  };

  // =====================================================
  // HANDLE THUMBNAIL UPLOAD
  // =====================================================

  const handleThumbnailUpload = async (episode, file) => {
    if (!file || !episode?.id) {
      return;
    }

    const episodeId = episode.id;

    try {
      setThumbnailUploading(episodeId);

      setError("");

      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      if (!R2_PUBLIC_URL) {
        throw new Error("VITE_R2_PUBLIC_URL is not configured");
      }

      const controller = createUploadController(episodeId);

      // -------------------------------------------------
      // 1. GET PRESIGNED URL
      // -------------------------------------------------

      const response = await api.post("/uploads/episode-thumbnail", {
        episodeId,
        fileName: file.name,
        contentType: file.type,
      });

      const uploadUrl = response.data?.uploadUrl;

      const storageKey = response.data?.key;

      if (!uploadUrl || !storageKey) {
        throw new Error("Thumbnail upload URL was not generated");
      }

      // -------------------------------------------------
      // 2. R2 UPLOAD
      // -------------------------------------------------

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },

        signal: controller.signal,
      });

      // -------------------------------------------------
      // 3. PUBLIC URL
      // -------------------------------------------------

      const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${storageKey}`;

      // -------------------------------------------------
      // 4. SAVE URL
      // -------------------------------------------------

      await api.patch(`/episodes/${episodeId}`, {
        thumbnailUrl: publicUrl,
      });

      await fetchEpisodes(true);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        setError("Thumbnail upload cancelled");
      } else {
        console.error(
          "Episode thumbnail upload error:",
          err.response?.data || err,
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to upload thumbnail",
        );
      }
    } finally {
      removeUploadController(episodeId);

      setThumbnailUploading(null);

      if (thumbnailFileRef.current) {
        thumbnailFileRef.current.value = "";
      }
    }
  };

  // =====================================================
  // SELECT THUMBNAIL
  // =====================================================

  const selectThumbnailFile = (episode) => {
    if (!episode?.id) return;

    const input = document.createElement("input");

    input.type = "file";

    input.accept = "image/png,image/jpeg,image/jpg,image/webp";

    input.onchange = (event) => {
      const file = event.target.files?.[0];

      if (file) {
        handleThumbnailUpload(episode, file);
      }
    };

    thumbnailFileRef.current = input;

    input.click();
  };

  // =====================================================
  // VIDEO STATUS
  // =====================================================

  const getVideoStatus = (episode) => {
    if (!episode?.video) {
      return {
        label: "No Video",

        className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",

        icon: Film,
      };
    }

    const status = String(episode.video.status || "").toUpperCase();

    if (status === "READY") {
      return {
        label: "READY",

        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

        icon: Check,
      };
    }

    if (status === "PROCESSING") {
      return {
        label: "PROCESSING",

        className: "bg-blue-500/10 text-blue-400 border-blue-500/20",

        icon: Clock3,
      };
    }

    if (status === "FAILED") {
      return {
        label: "FAILED",

        className: "bg-red-500/10 text-red-400 border-red-500/20",

        icon: AlertCircle,
      };
    }

    return {
      label: status || "UNKNOWN",

      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",

      icon: Clock3,
    };
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-[#090909] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-[#090909]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-5 sm:px-7 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/admin/series/${seriesId}/seasons`)}
                className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <PlayCircle size={19} className="text-red-500" />
                  </div>

                  <h1 className="text-2xl font-bold">Episodes</h1>
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Manage episodes and video content
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchEpisodes(true)}
                disabled={refreshing}
                className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>

              <button
                type="button"
                onClick={openAddForm}
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-semibold flex items-center gap-2 transition"
              >
                <Plus size={18} />
                Add Episode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-5 sm:px-7 lg:px-8 py-6">
        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">
            <AlertCircle size={19} className="text-red-400 mt-0.5" />

            <p className="flex-1 text-sm text-red-400">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-gray-500 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* SEASON INFO */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Season
              </p>

              <h2 className="text-xl font-semibold mt-1">
                {season?.title || `Season ${season?.seasonNumber || "—"}`}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {episodes.length}{" "}
                {episodes.length === 1 ? "episode" : "episodes"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-gray-400">
                Season #{season?.seasonNumber || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 size={30} className="animate-spin text-red-500" />

            <p className="text-sm text-gray-500 mt-3">Loading episodes...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <PlayCircle size={30} className="text-gray-600" />
            </div>

            <h3 className="text-lg font-semibold">No episodes yet</h3>

            <p className="text-sm text-gray-500 mt-1">
              Add the first episode to this season.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 flex items-center gap-2 text-sm font-semibold"
            >
              <Plus size={17} />
              Add First Episode
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold">Episode List</h2>

              <p className="text-xs text-gray-500 mt-1">
                Upload videos and manage episode metadata
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Episode
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Title
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Thumbnail
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Duration
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Video
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {episodes.map((episode) => {
                    const videoStatus = getVideoStatus(episode);

                    const StatusIcon = videoStatus.icon;

                    const uploading = videoUploading === episode.id;

                    const thumbnailLoading = thumbnailUploading === episode.id;

                    const publishing = publishingEpisode === episode.id;

                    const unpublishing = unpublishingEpisode === episode.id;

                    const isPublished =
                      String(episode?.status || "DRAFT").toUpperCase() ===
                      "PUBLISHED";

                    const videoReady =
                      String(episode?.video?.status || "").toUpperCase() ===
                      "READY";

                    return (
                      <tr
                        key={episode.id}
                        className="border-b border-white/[0.045] hover:bg-white/[0.025] transition"
                      >
                        {/* EPISODE */}
                        <td className="px-5 py-4">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                            <span className="font-bold text-red-400">
                              {episode.episodeNumber}
                            </span>
                          </div>
                        </td>

                        {/* TITLE */}
                        <td className="px-5 py-4">
                          <div className="max-w-[280px]">
                            <p className="font-semibold text-sm text-white truncate">
                              {episode.title}
                            </p>

                            {episode.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {episode.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* THUMBNAIL */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {episode.thumbnailUrl ? (
                              <img
                                src={episode.thumbnailUrl}
                                alt={episode.title}
                                className="w-20 h-11 rounded-lg object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-20 h-11 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center">
                                <ImageIcon
                                  size={18}
                                  className="text-gray-600"
                                />
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={thumbnailLoading}
                              onClick={() => selectThumbnailFile(episode)}
                              title={
                                episode.thumbnailUrl
                                  ? "Change Thumbnail"
                                  : "Upload Thumbnail"
                              }
                              className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-purple-500/10 hover:text-purple-400 text-gray-400 flex items-center gap-1.5 text-xs transition disabled:opacity-30"
                            >
                              {thumbnailLoading ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <ImageIcon size={15} />
                              )}

                              {thumbnailLoading
                                ? "Uploading..."
                                : episode.thumbnailUrl
                                  ? "Change"
                                  : "Upload"}
                            </button>
                          </div>
                        </td>

                        {/* DURATION */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-400">
                            {episode.duration
                              ? `${Math.floor(episode.duration / 60)}m`
                              : "—"}
                          </span>
                        </td>

                        {/* VIDEO */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold ${videoStatus.className}`}
                            >
                              {uploading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <StatusIcon size={13} />
                              )}

                              {uploading
                                ? `${videoProgress}%`
                                : videoStatus.label}
                            </span>

                            {uploading && (
                              <div className="w-32">
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-200"
                                    style={{
                                      width: `${videoProgress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {uploading && (
                              <button
                                type="button"
                                onClick={() => handleCancelUpload(episode.id)}
                                className="w-fit inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[11px] font-semibold hover:bg-red-500/15 transition"
                              >
                                <Ban size={13} />
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                              <Check size={13} />
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 text-[11px] font-semibold">
                              <Clock3 size={13} />
                              DRAFT
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* UPLOAD / REPLACE VIDEO */}
                            <button
                              type="button"
                              title={
                                episode.video ? "Replace Video" : "Upload Video"
                              }
                              disabled={uploading}
                              onClick={() => selectVideoFile(episode)}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:text-blue-400 text-gray-400 flex items-center justify-center transition disabled:opacity-30"
                            >
                              {uploading ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <Upload size={17} />
                              )}
                            </button>

                            {/* THUMBNAIL */}
                            <button
                              type="button"
                              title={
                                episode.thumbnailUrl
                                  ? "Change Thumbnail"
                                  : "Upload Thumbnail"
                              }
                              disabled={thumbnailLoading}
                              onClick={() => selectThumbnailFile(episode)}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-purple-500/10 hover:text-purple-400 text-gray-400 flex items-center justify-center transition disabled:opacity-30"
                            >
                              {thumbnailLoading ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <ImageIcon size={17} />
                              )}
                            </button>

                            {/* PUBLISH */}
                            {!isPublished ? (
                              <button
                                type="button"
                                title={
                                  videoReady
                                    ? "Publish Episode"
                                    : "Video must be READY"
                                }
                                disabled={
                                  !videoReady || publishing || uploading
                                }
                                onClick={() => handlePublishEpisode(episode)}
                                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:text-emerald-400 text-gray-400 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {publishing ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <Eye size={17} />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Unpublish Episode"
                                disabled={unpublishing}
                                onClick={() => handleUnpublishEpisode(episode)}
                                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-orange-500/10 hover:text-orange-400 text-gray-400 flex items-center justify-center transition disabled:opacity-30"
                              >
                                {unpublishing ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <EyeOff size={17} />
                                )}
                              </button>
                            )}

                            {/* EDIT */}
                            <button
                              type="button"
                              title="Edit Episode"
                              onClick={() => openEditForm(episode)}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-yellow-500/10 hover:text-yellow-400 text-gray-400 flex items-center justify-center transition"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              title="Delete Episode"
                              disabled={
                                deleteLoading === episode.id || uploading
                              }
                              onClick={() => handleDelete(episode)}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-400 text-gray-400 flex items-center justify-center transition disabled:opacity-40"
                            >
                              {deleteLoading === episode.id ? (
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

        {/* ==================================================
            ADD / EDIT FORM
        ================================================== */}

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
              {/* MODAL HEADER */}
              <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {editingEpisode ? "Edit Episode" : "Add Episode"}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Configure episode details
                  </p>
                </div>

                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* EPISODE NUMBER */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Episode Number
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={form.episodeNumber}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          episodeNumber: e.target.value,
                        }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-white outline-none focus:border-red-500/40"
                      placeholder="1"
                      required
                    />
                  </div>

                  {/* DURATION */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Duration (seconds)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-white outline-none focus:border-red-500/40"
                      placeholder="1500"
                    />
                  </div>
                </div>

                {/* TITLE */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Episode Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-white outline-none focus:border-red-500/40"
                    placeholder="Episode title"
                    required
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white outline-none resize-none focus:border-red-500/40"
                    placeholder="Episode description..."
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={formLoading}
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="h-11 px-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {formLoading && (
                      <Loader2 size={16} className="animate-spin" />
                    )}

                    {editingEpisode ? "Update Episode" : "Create Episode"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEpisodes;
