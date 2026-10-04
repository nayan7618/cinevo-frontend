import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import api from "../services/api";

import {
  X,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Film,
  Ban,
  RefreshCw,
} from "lucide-react";

const AdminMovieVideoModal = ({
  movie,
  onClose,
  onSuccess,
}) => {
  // =====================================================
  // STATE
  // =====================================================

  const [file, setFile] = useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  const [video, setVideo] =
    useState(null);

  const [videos, setVideos] =
    useState([]);

  const [loadingVideos, setLoadingVideos] =
    useState(true);

  const [retryingVideo, setRetryingVideo] =
    useState(null);

  // =====================================================
  // REFS
  // =====================================================

  const fileInputRef =
    useRef(null);

  const uploadControllerRef =
    useRef(null);

  const mountedRef =
    useRef(true);

  // =====================================================
  // API
  // =====================================================

  // =====================================================
  // FETCH MOVIE VIDEOS
  // =====================================================

  const fetchVideos = useCallback(
    async () => {
      if (!movie?.id) {
        return [];
      }

      try {
        setLoadingVideos(true);

        const response =
          await api.get(
            `/videos/movie/${movie.id}`,
          );

        if (
          !mountedRef.current
        ) {
          return [];
        }

        if (
          response.data?.success
        ) {
          const list =
            Array.isArray(
              response.data?.videos,
            )
              ? [...response.data.videos]
              : [];

          // Newest video first
          list.sort(
            (a, b) =>
              new Date(
                b.createdAt || 0,
              ).getTime() -
              new Date(
                a.createdAt || 0,
              ).getTime(),
          );

          setVideos(list);

          setVideo(
            list[0] || null,
          );

          return list;
        } else {
          setVideos([]);
          setVideo(null);

          return [];
        }
      } catch (err) {
        console.error(
          "Fetch movie videos error:",
          err.response?.data ||
            err,
        );

        if (
          mountedRef.current
        ) {
          setVideos([]);
          setVideo(null);
        }

        return [];
      } finally {
        if (
          mountedRef.current
        ) {
          setLoadingVideos(false);
        }
      }
    },
    [movie?.id],
  );

  // =====================================================
  // INITIAL LOAD + CLEANUP
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    fetchVideos();

    return () => {
      mountedRef.current =
        false;

      if (
        uploadControllerRef.current
      ) {
        uploadControllerRef.current.abort();

        uploadControllerRef.current =
          null;
      }
    };
  }, [fetchVideos]);

  // =====================================================
  // POLL PROCESSING STATUS
  // =====================================================

  useEffect(() => {
    const hasProcessingVideo =
      videos.some(
        (item) =>
          String(
            item?.status || "",
          ).toUpperCase() ===
          "PROCESSING",
      );

    if (
      !hasProcessingVideo
    ) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        fetchVideos();
      }, 5000);

    return () =>
      clearInterval(interval);
  }, [videos, fetchVideos]);

  // =====================================================
  // SELECT FILE
  // =====================================================

  const handleFileChange = (
    event,
  ) => {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setError("");
    setUploadProgress(0);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // -------------------------------------------------
    // Validate video
    // -------------------------------------------------

    if (
      !selectedFile.type.startsWith(
        "video/",
      )
    ) {
      setFile(null);

      setError(
        "Please select a valid video file.",
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }

      return;
    }

    setFile(
      selectedFile,
    );
  };

  // =====================================================
  // CLEAR FILE
  // =====================================================

  const clearFile = () => {
    if (uploading) {
      return;
    }

    setFile(null);

    setUploadProgress(0);

    setError("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  // =====================================================
  // CANCEL UPLOAD
  // =====================================================

  const handleCancelUpload =
    () => {
      if (
        uploadControllerRef.current
      ) {
        uploadControllerRef.current.abort();
      }
    };

  // =====================================================
  // CLEANUP TEMP R2 OBJECT
  // =====================================================

  const cleanupTemporaryUpload =
    async (storageKey) => {
      if (
        !storageKey ||
        !movie?.id
      ) {
        return;
      }

      try {
        await api.delete(
          "/uploads/object",
          {
            data: {
              movieId:
                movie.id,

              storageKey:
                storageKey,
            },
          },
        );

        console.log(
          "Temporary R2 object cleaned:",
          storageKey,
        );
      } catch (cleanupError) {
        console.error(
          "Temporary R2 cleanup failed:",
          cleanupError
            ?.response
            ?.data ||
            cleanupError,
        );
      }
    };

  // =====================================================
  // CLEANUP OLD FAILED VIDEOS
  // =====================================================

  const cleanupFailedVideos = async (
    items,
    keepVideoId = null,
  ) => {
    if (!Array.isArray(items)) {
      return;
    }

    const failedVideos = items.filter(
      (item) =>
        item?.id &&
        item.id !== keepVideoId &&
        String(
          item?.status || "",
        ).toUpperCase() === "FAILED",
    );

    if (!failedVideos.length) {
      return;
    }

    const results =
      await Promise.allSettled(
        failedVideos.map((item) =>
          api.delete(
            `/videos/${item.id}`,
          ),
        ),
      );

    results.forEach(
      (result, index) => {
        if (
          result.status ===
          "rejected"
        ) {
          console.error(
            "Failed to delete old failed video:",
            failedVideos[index]?.id,
            result.reason
              ?.response?.data ||
              result.reason,
          );
        }
      },
    );
  };

  // =====================================================
  // UPLOAD VIDEO
  // =====================================================

  const handleUpload =
    async () => {
      if (!file) {
        setError(
          "Please select a video file.",
        );

        return;
      }

      if (!movie?.id) {
        setError(
          "Movie ID is missing.",
        );

        return;
      }

      let uploadedStorageKey =
        null;

      // Important:
      // We only cleanup automatically if the upload
      // never reached the video DB request.
      //
      // Once DB request starts, its result can be
      // ambiguous during network failures.

      let videoRecordRequestStarted =
        false;

      try {
        setUploading(true);

        setError("");

        setUploadProgress(0);

        // -------------------------------------------------
        // Abort Controller
        // -------------------------------------------------

        const controller =
          new AbortController();

        uploadControllerRef.current =
          controller;

        // =================================================
        // 1. GET PRESIGNED URL
        // =================================================

        const uploadUrlResponse =
          await api.post(
            "/uploads/video",
            {
              movieId:
                movie.id,

              fileName:
                file.name,

              contentType:
                file.type,
            },
            {
              signal:
                controller.signal,
            },
          );

        if (
          !uploadUrlResponse
            .data
            ?.success
        ) {
          throw new Error(
            uploadUrlResponse.data
              ?.message ||
              "Failed to generate upload URL",
          );
        }

        const uploadUrl =
          uploadUrlResponse.data
            ?.uploadUrl;

        const storageKey =
          uploadUrlResponse.data
            ?.key;

        if (
          !uploadUrl ||
          !storageKey
        ) {
          throw new Error(
            "Upload URL was not generated",
          );
        }

        uploadedStorageKey =
          storageKey;

        // =================================================
        // 2. DIRECT R2 UPLOAD
        // =================================================

        await axios.put(
          uploadUrl,
          file,
          {
            headers: {
              "Content-Type":
                file.type,
            },

            signal:
              controller.signal,

            onUploadProgress:
              (
                progressEvent,
              ) => {
                if (
                  !progressEvent.total
                ) {
                  return;
                }

                const progress =
                  Math.round(
                    (progressEvent.loaded /
                      progressEvent.total) *
                      100,
                  );

                if (
                  mountedRef.current
                ) {
                  setUploadProgress(
                    progress,
                  );
                }
              },
          },
        );

        // =================================================
        // 3. GET FRESH VIDEO LIST
        // =================================================

        // Always read the latest database state before
        // deciding whether this is a new upload or replace.

        const latestVideos =
          await fetchVideos();

        // Prefer an existing READY video.
        // Otherwise use the latest available video.

        const currentVideo =
          latestVideos.find(
            (item) =>
              item?.id &&
              String(
                item?.status ||
                  "",
              ).toUpperCase() ===
                "READY",
          ) ||
          latestVideos.find(
            (item) =>
              item?.id,
          ) ||
          null;

        let videoResponse;

        // =================================================
        // 4A. REPLACE EXISTING VIDEO
        // =================================================

        if (
          currentVideo?.id
        ) {
          videoRecordRequestStarted =
            true;

          videoResponse =
            await api.post(
              `/videos/movie/${movie.id}/replace`,
              {
                oldVideoId:
                  currentVideo.id,

                storageKey:

                  storageKey,

                quality:
                  "FULL_HD",
              },
              {
                signal:
                  controller.signal,
              },
            );
        }

        // =================================================
        // 4B. CREATE FIRST VIDEO
        // =================================================

        else {
          videoRecordRequestStarted =
            true;

          videoResponse =
            await api.post(
              "/videos",
              {
                movieId:
                  movie.id,

                storageKey:

                  storageKey,

                quality:
                  "FULL_HD",
              },
              {
                signal:
                  controller.signal,
              },
            );
        }

        // =================================================
        // 5. VALIDATE RESPONSE
        // =================================================

        if (
          !videoResponse.data
            ?.success
        ) {
          throw new Error(
            videoResponse.data
              ?.message ||
              "Failed to create/replace video",
          );
        }

        // =================================================
        // 6. UPDATE UI
        // =================================================

        if (
          mountedRef.current
        ) {
          const createdVideo =
            videoResponse.data
              ?.video || null;

          setVideo(
            createdVideo,
          );

          setFile(null);

          setUploadProgress(
            100,
          );
        }

        // =================================================
        // 7. REFRESH VIDEO LIST
        // =================================================

        let refreshedVideos =
          await fetchVideos();

        // -------------------------------------------------
        // Remove stale FAILED records after a successful
        // upload/replace. The new video remains untouched.
        // -------------------------------------------------

        await cleanupFailedVideos(
          refreshedVideos,
          videoResponse.data?.video?.id ||
            null,
        );

        // Refresh again so the UI shows only the current
        // database state.
        refreshedVideos =
          await fetchVideos();

        // =================================================
        // 8. PARENT REFRESH
        // =================================================

        onSuccess?.();
      } catch (err) {
        const cancelled =
          err?.code ===
            "ERR_CANCELED" ||
          err?.name ===
            "CanceledError" ||
          err?.name ===
            "AbortError";

        // =================================================
        // CLEANUP ONLY BEFORE DB REQUEST
        // =================================================

        if (
          uploadedStorageKey &&
          !videoRecordRequestStarted
        ) {
          await cleanupTemporaryUpload(
            uploadedStorageKey,
          );
        }

        // =================================================
        // CANCELLED
        // =================================================

        if (cancelled) {
          if (
            mountedRef.current
          ) {
            setError(
              "Video upload cancelled.",
            );

            setUploadProgress(
              0,
            );
          }
        }

        // =================================================
        // NORMAL ERROR
        // =================================================

        else {
          console.error(
            "Movie video upload error:",
            err.response?.data ||
              err,
          );

          if (
            mountedRef.current
          ) {
            setError(
              err.response
                ?.data
                ?.message ||
                err.message ||
                "Video upload failed",
            );
          }
        }
      } finally {
        uploadControllerRef.current =
          null;

        if (
          mountedRef.current
        ) {
          setUploading(false);

          if (
            fileInputRef.current
          ) {
            fileInputRef.current.value =
              "";
          }
        }
      }
    };

  // =====================================================
  // RETRY FAILED PROCESSING
  // =====================================================

  const handleRetryProcessing =
    async (item) => {
      if (!item?.id) {
        return;
      }

      try {
        setRetryingVideo(
          item.id,
        );

        setError("");

        const response =
          await api.post(
            `/videos/${item.id}/process`,
          );

        if (
          !response.data
            ?.success
        ) {
          throw new Error(
            response.data
              ?.message ||
              "Failed to retry processing",
          );
        }

        await fetchVideos();
      } catch (err) {
        console.error(
          "Retry processing error:",
          err.response?.data ||
            err,
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to restart processing",
        );
      } finally {
        setRetryingVideo(
          null,
        );
      }
    };

  // =====================================================
  // STATUS UI
  // =====================================================

  const getStatusUI = (
    status,
  ) => {
    const normalized =
      String(
        status || "",
      ).toUpperCase();

    switch (normalized) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            READY
          </span>
        );

      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            PROCESSING
          </span>
        );

      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            FAILED
          </span>
        );

      default:
        return (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
            {status ||
              "UNKNOWN"}
          </span>
        );
    }
  };

  // =====================================================
  // FILE SIZE
  // =====================================================

  const formatFileSize = (
    bytes,
  ) => {
    if (
      !bytes ||
      bytes <= 0
    ) {
      return "0 MB";
    }

    const gb =
      bytes /
      (1024 * 1024 * 1024);

    const mb =
      bytes /
      (1024 * 1024);

    if (gb >= 1) {
      return `${gb.toFixed(
        2,
      )} GB`;
    }

    return `${mb.toFixed(
      1,
    )} MB`;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] shadow-2xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Manage Video
            </h2>

            <p className="mt-1 text-sm text-white/40">
              {movie?.title}
            </p>
          </div>

          <button
            type="button"
            disabled={
              uploading
            }
            onClick={
              onClose
            }
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>

        </div>


        <div className="space-y-6 p-5">

          {/* =================================================
              UPLOAD
          ================================================= */}

          <div>

            <label className="mb-2 block text-sm font-medium text-white/80">
              Upload Movie Video
            </label>


            <div
              className={`rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 ${
                uploading
                  ? "opacity-60"
                  : ""
              }`}
            >

              <input
                ref={
                  fileInputRef
                }
                id="movie-video"
                type="file"
                accept="video/*"
                disabled={
                  uploading
                }
                onChange={
                  handleFileChange
                }
                className="hidden"
              />


              <label
                htmlFor="movie-video"
                className={`flex flex-col items-center justify-center gap-3 py-5 text-center ${
                  uploading
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">

                  <Film className="h-6 w-6 text-red-500" />

                </div>


                <div>

                  <p className="text-sm font-medium text-white">

                    {file
                      ? file.name
                      : "Choose a video file"}

                  </p>


                  <p className="mt-1 text-xs text-white/40">
                    MP4, WebM and other video formats
                  </p>


                  {file && (
                    <p className="mt-1 text-xs text-white/30">
                      {formatFileSize(
                        file.size,
                      )}
                    </p>
                  )}

                </div>

              </label>

            </div>

          </div>


          {/* =================================================
              PROGRESS
          ================================================= */}

          {uploading && (

            <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4">

              <div className="mb-2 flex items-center justify-between text-xs">

                <span className="text-white/50">
                  Uploading to R2...
                </span>

                <span className="font-medium text-white/80">
                  {uploadProgress}%
                </span>

              </div>


              <div className="h-2 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-red-600 transition-all duration-200"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />

              </div>


              <div className="mt-3 flex items-center justify-between gap-3">

                <span className="text-xs text-white/30">
                  Uploading movie video...
                </span>


                <button
                  type="button"
                  onClick={
                    handleCancelUpload
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/15"
                >

                  <Ban className="h-3.5 w-3.5" />

                  Cancel

                </button>

              </div>

            </div>

          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              UPLOAD / REPLACE BUTTON
          ================================================= */}

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                handleUpload
              }
              disabled={
                !file ||
                uploading ||
                loadingVideos
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {uploading ? (

                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Uploading{" "}
                  {uploadProgress}%

                </>

              ) : (

                <>
                  <Upload className="h-4 w-4" />

                  {videos.length >
                  0
                    ? "Replace Video"
                    : "Upload Video"}

                </>

              )}

            </button>


            {file &&
              !uploading && (

                <button
                  type="button"
                  onClick={
                    clearFile
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Clear
                </button>

              )}

          </div>


          {/* =================================================
              EXISTING VIDEOS
          ================================================= */}

          <div>

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-sm font-semibold text-white">
                Movie Videos
              </h3>


              <span className="text-xs text-white/40">

                {videos.length}{" "}
                video
                {videos.length !==
                1
                  ? "s"
                  : ""}

              </span>

            </div>


            {loadingVideos ? (

              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-8">

                <Loader2 className="h-5 w-5 animate-spin text-white/40" />

              </div>

            ) : videos.length ===
              0 ? (

              <div className="rounded-xl border border-white/10 bg-white/[0.02] py-8 text-center">

                <Film className="mx-auto h-8 w-8 text-white/20" />

                <p className="mt-2 text-sm text-white/40">
                  No video uploaded
                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {videos.map(
                  (
                    item,
                    index,
                  ) => {

                    const status =
                      String(
                        item?.status ||
                          "",
                      ).toUpperCase();

                    const retrying =
                      retryingVideo ===
                      item.id;

                    return (

                      <div
                        key={
                          item.id
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="text-sm font-medium text-white">
                                {item.quality ||
                                  "FULL_HD"}
                              </p>


                              {index ===
                                0 && (

                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40">
                                  Latest
                                </span>

                              )}

                            </div>


                            <p className="mt-1 truncate text-xs text-white/35">
                              {item.id}
                            </p>


                            {item.storageKey && (

                              <p className="mt-1 truncate text-[11px] text-white/25">
                                {item.storageKey}
                              </p>

                            )}

                          </div>


                          <div className="shrink-0">

                            {getStatusUI(
                              item.status,
                            )}

                          </div>

                        </div>


                        {/* FAILED */}

                        {status ===
                          "FAILED" && (

                          <button
                            type="button"
                            onClick={() =>
                              handleRetryProcessing(
                                item,
                              )
                            }
                            disabled={
                              retrying
                            }
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {retrying ? (

                              <Loader2 className="h-3.5 w-3.5 animate-spin" />

                            ) : (

                              <RefreshCw className="h-3.5 w-3.5" />

                            )}

                            Retry Processing

                          </button>

                        )}

                      </div>

                    );
                  },
                )}

              </div>

            )}

          </div>


          {/* =================================================
              INFO
          ================================================= */}

          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-xs leading-5 text-white/50">

            Video upload-এর পরে HLS processing automatically
            start হবে।

            <span className="mx-1 font-medium text-yellow-400">
              PROCESSING
            </span>

            শেষ হলে status

            <span className="mx-1 font-medium text-green-400">
              READY
            </span>

            হবে।

            Replace করলে নতুন video READY হওয়ার পরে
            old video cleanup করা হবে।

          </div>


          {/* =================================================
              CLOSE
          ================================================= */}

          <div className="flex justify-end border-t border-white/10 pt-4">

            <button
              type="button"
              disabled={
                uploading
              }
              onClick={
                onClose
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Close
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminMovieVideoModal;