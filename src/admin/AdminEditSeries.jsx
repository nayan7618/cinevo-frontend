import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "../services/api";

import {
  X,
  Save,
  Loader2,
  Check,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";

const R2_PUBLIC_URL =
  import.meta.env.VITE_R2_PUBLIC_URL || "";

// =====================================================
// DARK SELECT
// =====================================================

const DarkSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select",
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (item) =>
      String(item.value) === String(value),
  );

  useEffect(() => {
    const handler = (event) => {
      if (!event.target.closest("[data-dark-select]")) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handler,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handler,
      );
    };
  }, []);

  return (
    <div
      data-dark-select
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm transition hover:border-white/20"
      >
        <span
          className={
            selected
              ? "text-white"
              : "text-white/40"
          }
        >
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl border border-white/10 bg-[#111111] p-1.5 shadow-2xl">
          {options.map((option) => {
            const active =
              String(option.value) ===
              String(value);

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {option.label}

                {active && (
                  <Check size={15} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =====================================================
// MULTI SELECT
// =====================================================

const DarkMultiSelect = ({
  value,
  onChange,
  options,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if (
        !event.target.closest(
          "[data-multi-select]",
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handler,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handler,
      );
    };
  }, []);

  const selectedNames = options
    .filter((item) =>
      value.includes(item.value),
    )
    .map((item) => item.label);

  return (
    <div
      data-multi-select
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm"
      >
        <span
          className={
            selectedNames.length
              ? "text-white"
              : "text-white/40"
          }
        >
          {selectedNames.length
            ? selectedNames.join(", ")
            : "Select genres"}
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#111111] p-1.5 shadow-2xl">
          {options.map((option) => {
            const active =
              value.includes(option.value);

            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  if (active) {
                    onChange(
                      value.filter(
                        (id) =>
                          id !== option.value,
                      ),
                    );
                  } else {
                    onChange([
                      ...value,
                      option.value,
                    ]);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {option.label}

                {active && (
                  <Check size={15} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500/50";

// =====================================================
// ADMIN EDIT SERIES
// =====================================================

const AdminEditSeries = ({
  series,
  onClose,
  onSeriesUpdated,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    genreIds: [],
    releaseYear: "",
    language: "",
    ageRating: "",
  });

  const [categories, setCategories] =
    useState([]);

  const [genres, setGenres] =
    useState([]);

  const [posterFile, setPosterFile] =
    useState(null);

  const [backdropFile, setBackdropFile] =
    useState(null);

  const [posterPreview, setPosterPreview] =
    useState("");

  const [backdropPreview, setBackdropPreview] =
    useState("");

  const [removePoster, setRemovePoster] =
    useState(false);

  const [removeBackdrop, setRemoveBackdrop] =
    useState(false);

  const posterInputRef = useRef(null);
  const backdropInputRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // INITIAL FORM
  // ===================================================

  useEffect(() => {
    if (!series) return;

    const existingGenreIds = Array.isArray(
      series.genres,
    )
      ? series.genres
          .map((item) => item?.genreId)
          .filter(Boolean)
      : [];

    setForm({
      title: series.title || "",
      description:
        series.description || "",
      categoryId:
        series.categoryId || "",
      genreIds: existingGenreIds,
      releaseYear:
        series.releaseYear || "",
      language:
        series.language || "",
      ageRating:
        series.ageRating || "",
    });

    setPosterPreview(
      series.posterUrl || "",
    );

    setBackdropPreview(
      series.backdropUrl || "",
    );

    setRemovePoster(false);
    setRemoveBackdrop(false);
  }, [series]);

  // ===================================================
  // LOAD CATEGORIES + GENRES
  // ===================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          categoryResponse,
          genreResponse,
        ] = await Promise.all([
          api.get("/categories"),
          api.get("/genres"),
        ]);

        setCategories(
          categoryResponse.data
            ?.categories || [],
        );

        setGenres(
          genreResponse.data?.genres ||
            [],
        );
      } catch (err) {
        console.error(
          "Load categories/genres error:",
          err,
        );

        setError(
          err.response?.data?.message ||
            "Failed to load categories and genres",
        );
      }
    };

    loadData();
  }, []);

  // ===================================================
  // UPDATE FIELD
  // ===================================================

  const updateField = (
    field,
    value,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // POSTER CHANGE
  // ===================================================

  const handlePosterChange = (
    event,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setRemovePoster(false);
    setPosterFile(file);

    setPosterPreview(
      URL.createObjectURL(file),
    );
  };

  const handleRemovePoster = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setPosterFile(null);
    setPosterPreview("");
    setRemovePoster(true);

    if (posterInputRef.current) {
      posterInputRef.current.value = "";
    }
  };

  // ===================================================
  // BACKDROP CHANGE
  // ===================================================

  const handleBackdropChange = (
    event,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setRemoveBackdrop(false);
    setBackdropFile(file);

    setBackdropPreview(
      URL.createObjectURL(file),
    );
  };

  const handleRemoveBackdrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setBackdropFile(null);
    setBackdropPreview("");
    setRemoveBackdrop(true);

    if (backdropInputRef.current) {
      backdropInputRef.current.value = "";
    }
  };

  // ===================================================
  // UPLOAD IMAGE
  // ===================================================

  const uploadSeriesImage = async (
    file,
    imageType,
  ) => {
    if (!file) return null;

    const response = await api.post(
      "/uploads/series-image",
      {
        seriesId: series.id,
        fileName: file.name,
        contentType: file.type,
        imageType,
      },
    );

    const uploadUrl =
      response.data?.uploadUrl;

    const key =
      response.data?.key;

    if (!uploadUrl || !key) {
      throw new Error(
        "Invalid image upload response",
      );
    }

    // Upload directly to R2
    await axios.put(
      uploadUrl,
      file,
      {
        headers: {
          "Content-Type": file.type,
        },
      },
    );

    if (!R2_PUBLIC_URL) {
      throw new Error(
        "VITE_R2_PUBLIC_URL is not configured",
      );
    }

    return `${R2_PUBLIC_URL}/${key}`;
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!series?.id) {
      setError("Invalid series");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!form.title.trim()) {
        throw new Error(
          "Title is required",
        );
      }

      if (!form.description.trim()) {
        throw new Error(
          "Description is required",
        );
      }

      if (!form.releaseYear) {
        throw new Error(
          "Release year is required",
        );
      }

      if (!form.categoryId) {
        throw new Error(
          "Please select a category",
        );
      }

      if (form.genreIds.length === 0) {
        throw new Error(
          "Please select at least one genre",
        );
      }

      // -----------------------------------------------
      // UPLOAD POSTER
      // -----------------------------------------------

      let posterUrl =
        series.posterUrl || null;

      if (posterFile) {
        posterUrl =
          await uploadSeriesImage(
            posterFile,
            "poster",
          );
      } else if (removePoster) {
        posterUrl = null;
      }

      // -----------------------------------------------
      // UPLOAD BACKDROP
      // -----------------------------------------------

      let backdropUrl =
        series.backdropUrl || null;

      if (backdropFile) {
        backdropUrl =
          await uploadSeriesImage(
            backdropFile,
            "backdrop",
          );
      } else if (removeBackdrop) {
        backdropUrl = null;
      }

      // -----------------------------------------------
      // UPDATE SERIES
      // -----------------------------------------------

      const response = await api.patch(
        `/series/${series.id}`,
        {
          title: form.title.trim(),

          description:
            form.description.trim(),

          categoryId:
            form.categoryId,

          genreIds:
            form.genreIds,

          releaseYear:
            Number(form.releaseYear),

          language:
            form.language.trim(),

          ageRating:
            form.ageRating.trim(),

          posterUrl,

          backdropUrl,
        },
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update series",
        );
      }

      onSeriesUpdated?.();
    } catch (err) {
      console.error(
        "Update series error:",
        err,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update series",
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e12] shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0e0e12] px-6 py-4">

          <div>
            <h2 className="text-xl font-bold text-white">
              Edit Series
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Update series information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* BASIC INFO */}

          <div className="grid gap-5 md:grid-cols-2">

            {/* TITLE */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Title
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  updateField(
                    "title",
                    e.target.value,
                  )
                }
                className={inputClass}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Description
              </label>

              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value,
                  )
                }
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Category
              </label>

              <DarkSelect
                value={form.categoryId}
                onChange={(value) =>
                  updateField(
                    "categoryId",
                    value,
                  )
                }
                options={[
                  {
                    value: "",
                    label: "Select category",
                  },
                  ...categories.map(
                    (item) => ({
                      value: item.id,
                      label: item.name,
                    }),
                  ),
                ]}
              />
            </div>

            {/* GENRES */}

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Genres
              </label>

              <DarkMultiSelect
                value={form.genreIds}
                onChange={(value) =>
                  updateField(
                    "genreIds",
                    value,
                  )
                }
                options={genres.map(
                  (item) => ({
                    value: item.id,
                    label: item.name,
                  }),
                )}
              />
            </div>

            {/* RELEASE YEAR */}

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Release Year
              </label>

              <input
                type="number"
                min="1900"
                max="2100"
                value={form.releaseYear}
                onChange={(e) =>
                  updateField(
                    "releaseYear",
                    e.target.value,
                  )
                }
                className={inputClass}
              />
            </div>

            {/* LANGUAGE */}

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Language
              </label>

              <input
                type="text"
                value={form.language}
                onChange={(e) =>
                  updateField(
                    "language",
                    e.target.value,
                  )
                }
                className={inputClass}
              />
            </div>

            {/* AGE RATING */}

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Age Rating
              </label>

              <input
                type="text"
                value={form.ageRating}
                onChange={(e) =>
                  updateField(
                    "ageRating",
                    e.target.value,
                  )
                }
                className={inputClass}
              />
            </div>

          </div>

          {/* IMAGES */}

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              Series Images
            </h3>

            <div className="grid gap-5 md:grid-cols-2">

              {/* POSTER */}

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Poster
                </label>

                <div className="relative">
                  <label className="block cursor-pointer">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-black/20">

                      {posterPreview ? (
                        <img
                          src={posterPreview}
                          alt="Poster"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white/20" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
                        Click to change poster
                      </div>
                    </div>

                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={
                        handlePosterChange
                      }
                    />
                  </label>

                  {posterPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      disabled={loading}
                      className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/75 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove poster"
                      title="Remove poster"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

              {/* BACKDROP */}

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Backdrop
                </label>

                <div className="relative">
                  <label className="block cursor-pointer">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/20">

                      {backdropPreview ? (
                        <img
                          src={backdropPreview}
                          alt="Backdrop"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white/20" />
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
                        Click to change backdrop
                      </div>
                    </div>

                    <input
                      ref={backdropInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={
                        handleBackdropChange
                      }
                    />
                  </label>

                  {backdropPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveBackdrop}
                      disabled={loading}
                      className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/75 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Remove backdrop"
                      title="Remove backdrop"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditSeries;