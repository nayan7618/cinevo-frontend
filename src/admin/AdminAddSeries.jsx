import { useEffect, useRef, useState } from "react";
import axios from "axios";
import api from "../services/api";

import {
  X,
  Plus,
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
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm"
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
          className={
            open ? "rotate-180" : ""
          }
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 rounded-xl border border-white/10 bg-[#111] p-1.5 shadow-2xl">
          {options.map((option) => {
            const active =
              String(option.value) ===
              String(value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10"
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
      if (!event.target.closest("[data-multi-select]")) {
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
        onClick={() => setOpen((v) => !v)}
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
          className={
            open ? "rotate-180" : ""
          }
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#111] p-1.5 shadow-2xl">
          {options.map((option) => {
            const active =
              value.includes(option.value);

            return (
              <button
                key={option.value}
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
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/10"
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
// INPUT
// =====================================================

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500/50";

// =====================================================
// ADMIN ADD SERIES
// =====================================================

const AdminAddSeries = ({
  onClose,
  onSeriesCreated,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    genreIds: [],
    releaseYear: "",
    language: "English",
    ageRating: "U/A",
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

  const posterInputRef = useRef(null);
  const backdropInputRef = useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // LOAD FILTER DATA
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
          categoryResponse.data?.categories ||
            [],
        );

        setGenres(
          genreResponse.data?.genres ||
            [],
        );
      } catch (err) {
        console.error(
          "Load series form data error:",
          err,
        );

        setError(
          "Failed to load categories and genres",
        );
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (posterPreview.startsWith("blob:")) {
        URL.revokeObjectURL(posterPreview);
      }
      if (backdropPreview.startsWith("blob:")) {
        URL.revokeObjectURL(backdropPreview);
      }
    };
  }, [posterPreview, backdropPreview]);

  // ===================================================
  // CHANGE FIELD
  // ===================================================

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // FILE CHANGE
  // ===================================================

  const handlePosterChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setPosterFile(file);

    setPosterPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleBackdropChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setBackdropFile(file);

    setBackdropPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  };

  // ===================================================
  // REMOVE SELECTED IMAGE
  // ===================================================

  const handleRemovePoster = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setPosterFile(null);
    setPosterPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return "";
    });

    if (posterInputRef.current) {
      posterInputRef.current.value = "";
    }
  };

  const handleRemoveBackdrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setBackdropFile(null);
    setBackdropPreview((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return "";
    });

    if (backdropInputRef.current) {
      backdropInputRef.current.value = "";
    }
  };

  // ===================================================
  // UPLOAD SERIES IMAGE
  // ===================================================

  const uploadSeriesImage = async (
    seriesId,
    file,
    imageType,
  ) => {
    if (!file) return null;

    const response = await api.post(
      "/uploads/series-image",
      {
        seriesId,
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

    await axios.put(
      uploadUrl,
      file,
      {
        headers: {
          "Content-Type": file.type,
        },
      },
    );

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : null;

    if (!publicUrl) {
      throw new Error(
        "VITE_R2_PUBLIC_URL is not configured",
      );
    }

    return publicUrl;
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (!form.title.trim()) {
        throw new Error(
          "Title is required",
        );
      }

      if (
        !form.description.trim()
      ) {
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

      if (
        form.genreIds.length === 0
      ) {
        throw new Error(
          "Please select at least one genre",
        );
      }

      // -----------------------------------------------
      // CREATE SERIES
      // -----------------------------------------------

      const response = await api.post(
        "/series",
        {
          title: form.title.trim(),
          description:
            form.description.trim(),
          categoryId: form.categoryId,
          genreIds: form.genreIds,
          releaseYear:
            Number(form.releaseYear),
          language:
            form.language.trim(),
          ageRating:
            form.ageRating.trim(),
          status: "DRAFT",
        },
      );

      const createdSeries =
        response.data?.series;

      if (
        !response.data?.success ||
        !createdSeries?.id
      ) {
        throw new Error(
          response.data?.message ||
            "Failed to create series",
        );
      }

      // -----------------------------------------------
      // UPLOAD POSTER
      // -----------------------------------------------

      let posterUrl = null;

      if (posterFile) {
        posterUrl =
          await uploadSeriesImage(
            createdSeries.id,
            posterFile,
            "poster",
          );
      }

      // -----------------------------------------------
      // UPLOAD BACKDROP
      // -----------------------------------------------

      let backdropUrl = null;

      if (backdropFile) {
        backdropUrl =
          await uploadSeriesImage(
            createdSeries.id,
            backdropFile,
            "backdrop",
          );
      }

      // -----------------------------------------------
      // SAVE IMAGE URLS
      // -----------------------------------------------

      if (posterUrl || backdropUrl) {
        await api.patch(
          `/series/${createdSeries.id}`,
          {
            ...(posterUrl && {
              posterUrl,
            }),
            ...(backdropUrl && {
              backdropUrl,
            }),
          },
        );
      }

      // -----------------------------------------------
      // DONE
      // -----------------------------------------------

      onSeriesCreated?.();
    } catch (err) {
      console.error(
        "Create series error:",
        err,
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create series",
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
              Add Series
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Create a new series
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

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Title
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  updateField(
                    "title",
                    e.target.value,
                  )
                }
                placeholder="Series title"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-white/60">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value,
                  )
                }
                rows={5}
                placeholder="Series description"
                className={`${inputClass} resize-none`}
              />
            </div>

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

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Release Year
              </label>

              <input
                type="number"
                value={form.releaseYear}
                onChange={(e) =>
                  updateField(
                    "releaseYear",
                    e.target.value,
                  )
                }
                placeholder="2026"
                min="1900"
                max="2100"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Language
              </label>

              <input
                value={form.language}
                onChange={(e) =>
                  updateField(
                    "language",
                    e.target.value,
                  )
                }
                placeholder="English"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">
                Age Rating
              </label>

              <input
                value={form.ageRating}
                onChange={(e) =>
                  updateField(
                    "ageRating",
                    e.target.value,
                  )
                }
                placeholder="U/A"
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

                <label className="group block cursor-pointer">
                  <div className="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/20">
                    {posterPreview ? (
                      <>
                        <img
                          src={posterPreview}
                          alt="Poster preview"
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={handleRemovePoster}
                          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow-lg transition hover:bg-red-600"
                          aria-label="Remove poster"
                        >
                          <X size={16} />
                        </button>

                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
                          Click to change poster
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-white/20" />
                        <p className="text-sm text-white/40">
                          Choose poster
                        </p>
                      </div>
                    )}
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
              </div>

              {/* BACKDROP */}

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Backdrop
                </label>

                <label className="group block cursor-pointer">
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/20">
                    {backdropPreview ? (
                      <>
                        <img
                          src={backdropPreview}
                          alt="Backdrop preview"
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={handleRemoveBackdrop}
                          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white shadow-lg transition hover:bg-red-600"
                          aria-label="Remove backdrop"
                        >
                          <X size={16} />
                        </button>

                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
                          Click to change backdrop
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-white/20" />
                        <p className="text-sm text-white/40">
                          Choose backdrop
                        </p>
                      </div>
                    )}
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
              </div>

            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Series
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAddSeries;