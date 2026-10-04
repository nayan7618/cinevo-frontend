import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import {
  X,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Film,
  Loader2,
  Check,
} from "lucide-react";

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";

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
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const selected = options.find((item) => String(item.value) === String(value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-left text-sm text-white transition ${
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-white/20"
        }`}
      >
        <span className={selected ? "text-white" : "text-gray-500"}>
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[200] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {options.map((item) => {
              const isSelected = String(item.value) === String(value);

              return (
                <button
                  key={String(item.value)}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>

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
   DARK MULTI SELECT
========================================================= */

const DarkMultiSelect = ({ values, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const toggle = (id) => {
    if (values.includes(id)) {
      onChange(values.filter((value) => value !== id));
    } else {
      onChange([...values, id]);
    }
  };

  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-2.5 text-left transition hover:border-white/20"
      >
        <div className="flex flex-1 flex-wrap gap-2">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-gray-500">Select genres</span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white"
              >
                {option.label}

                <span
                  className="cursor-pointer text-gray-400 hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(option.value);
                  }}
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </div>

        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[200] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
          <div className="max-h-64 overflow-y-auto p-1.5">
            {options.map((option) => {
              const selected = values.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{option.label}</span>

                  {selected && <Check size={15} />}
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
   INPUT
========================================================= */

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-white/25";

/* =========================================================
   COMPONENT
========================================================= */

const AdminEditMovie = ({ movie, onClose, onMovieUpdated }) => {
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);

  const [genres, setGenres] = useState([]);

  const [posterFile, setPosterFile] = useState(null);

  const [backdropFile, setBackdropFile] = useState(null);

  const [posterPreview, setPosterPreview] = useState("");
  const [removePoster, setRemovePoster] = useState(false);

  const [backdropPreview, setBackdropPreview] = useState("");
  const [removeBackdrop, setRemoveBackdrop] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    genreIds: [],
    releaseYear: "",
    duration: "",
    language: "English",
    ageRating: "UA",
  });

  /* =========================================================
     STATIC OPTIONS
  ========================================================= */

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi" },
    { value: "Bengali", label: "Bengali" },
    { value: "Tamil", label: "Tamil" },
    { value: "Telugu", label: "Telugu" },
    { value: "Malayalam", label: "Malayalam" },
    { value: "Kannada", label: "Kannada" },
    { value: "Marathi", label: "Marathi" },
    { value: "Punjabi", label: "Punjabi" },
    { value: "Gujarati", label: "Gujarati" },
  ];

  const ageRatingOptions = [
    { value: "U", label: "U" },
    { value: "UA", label: "UA" },
    { value: "A", label: "A" },
    { value: "13+", label: "13+" },
    { value: "16+", label: "16+" },
    { value: "18+", label: "18+" },
  ];

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 35 }, (_, index) => {
      const year = currentYear - index;

      return {
        value: String(year),
        label: String(year),
      };
    });
  }, []);

  /* =========================================================
     LOAD FORM FROM MOVIE
  ========================================================= */

  useEffect(() => {
    if (!movie) return;

    setForm({
      title: movie.title || "",
      description: movie.description || "",
      categoryId: movie.category?.id || movie.categoryId || "",
      genreIds:
        movie.genres
          ?.map((item) => item.genre?.id || item.genreId)
          .filter(Boolean) || [],
      releaseYear: movie.releaseYear ? String(movie.releaseYear) : "",
      duration: movie.duration ? String(movie.duration) : "",
      language: movie.language || "English",
      ageRating: movie.ageRating || "UA",
    });

    setPosterPreview(movie.posterUrl || "");
    setRemovePoster(false);

    setBackdropPreview(movie.backdropUrl || "");
    setRemoveBackdrop(false);
  }, [movie]);

  /* =========================================================
     FETCH META
  ========================================================= */

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        setError("");

        const [categoryResponse, genreResponse] = await Promise.all([
          api.get("/categories"),
          api.get("/genres"),
        ]);

        const categoryData = categoryResponse.data;

        const genreData = genreResponse.data;

        setCategories(
          categoryData?.categories ||
            categoryData?.data ||
            (Array.isArray(categoryData) ? categoryData : []),
        );

        setGenres(
          genreData?.genres ||
            genreData?.data ||
            (Array.isArray(genreData) ? genreData : []),
        );
      } catch (err) {
        console.error("Edit movie metadata error:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load categories and genres.",
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, []);

  /* =========================================================
     OPTIONS
  ========================================================= */

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  const genreOptions = useMemo(() => {
    return genres.map((genre) => ({
      value: genre.id,
      label: genre.name,
    }));
  }, [genres]);

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     POSTER
  ========================================================= */

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Poster must be an image.");
      return;
    }

    setPosterFile(file);
    setRemovePoster(false);
    setPosterPreview(URL.createObjectURL(file));
  };

  /* =========================================================
     BACKDROP
  ========================================================= */

  const handleBackdropChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Backdrop must be an image.");
      return;
    }

    setBackdropFile(file);
    setRemoveBackdrop(false);
    setBackdropPreview(URL.createObjectURL(file));
  };

  /* =========================================================
     IMAGE REMOVE / RESET
  ========================================================= */

  const handleRemovePoster = () => {
    // If a new file was selected, X only cancels that selection.
    if (posterFile) {
      setPosterFile(null);
      setPosterPreview(movie.posterUrl || "");
      setRemovePoster(false);
      return;
    }

    // Existing saved image: mark it for deletion on Save Changes.
    setPosterPreview("");
    setRemovePoster(true);
  };

  const handleRemoveBackdrop = () => {
    // If a new file was selected, X only cancels that selection.
    if (backdropFile) {
      setBackdropFile(null);
      setBackdropPreview(movie.backdropUrl || "");
      setRemoveBackdrop(false);
      return;
    }

    // Existing saved image: mark it for deletion on Save Changes.
    setBackdropPreview("");
    setRemoveBackdrop(true);
  };

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const uploadMovieImage = async ({ file, imageType }) => {
    const response = await api.post("/uploads/movie-image", {
      movieId: movie.id,
      fileName: file.name,
      contentType: file.type,
      imageType,
    });

    const data = response.data;

    if (!data?.uploadUrl || !data?.key) {
      throw new Error(`Failed to generate ${imageType} upload URL.`);
    }

    const r2UploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!r2UploadResponse.ok) {
      throw new Error(`Image upload failed (${r2UploadResponse.status})`);
    }

    const publicBase = R2_PUBLIC_URL.replace(/\/$/, "");

    if (!publicBase) {
      throw new Error("VITE_R2_PUBLIC_URL is not configured.");
    }

    return `${publicBase}/${data.key}`;
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (form.title.trim().length < 2) {
      return "Movie title must be at least 2 characters.";
    }

    if (form.description.trim().length < 10) {
      return "Description must be at least 10 characters.";
    }

    if (!form.categoryId) {
      return "Please select a category.";
    }

    if (!form.genreIds.length) {
      return "Please select at least one genre.";
    }

    const releaseYear = Number(form.releaseYear);

    if (!Number.isInteger(releaseYear)) {
      return "Invalid release year.";
    }

    const duration = Number(form.duration);

    if (!Number.isInteger(duration) || duration <= 0) {
      return "Duration must be a positive number.";
    }

    if (!form.language) {
      return "Please select language.";
    }

    if (!form.ageRating) {
      return "Please select age rating.";
    }

    return "";
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      let posterUrl = movie.posterUrl || undefined;

      let backdropUrl = movie.backdropUrl || undefined;

      /* -----------------------------------------
         NEW POSTER
      ----------------------------------------- */

      if (posterFile) {
        posterUrl = await uploadMovieImage({
          file: posterFile,
          imageType: "poster",
        });
      } else if (removePoster) {
        posterUrl = null;
      }

      /* -----------------------------------------
         NEW BACKDROP
      ----------------------------------------- */

      if (backdropFile) {
        backdropUrl = await uploadMovieImage({
          file: backdropFile,
          imageType: "backdrop",
        });
      } else if (removeBackdrop) {
        backdropUrl = null;
      }

      /* -----------------------------------------
         UPDATE MOVIE
      ----------------------------------------- */

      const payload = {
        title: form.title.trim(),

        description: form.description.trim(),

        releaseYear: Number(form.releaseYear),

        duration: Number(form.duration),

        language: form.language.trim(),

        ageRating: form.ageRating.trim(),

        categoryId: form.categoryId,

        genreIds: form.genreIds,
      };

      if (posterFile || removePoster) {
        payload.posterUrl = posterUrl ?? null;
      }

      if (backdropFile || removeBackdrop) {
        payload.backdropUrl = backdropUrl ?? null;
      }

      const response = await api.patch(`/movies/${movie.id}`, payload);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update movie.");
      }

      const updatedMovie = response.data.movie;

      setSuccess("Movie updated successfully.");

      if (typeof onMovieUpdated === "function") {
        onMovieUpdated(updatedMovie);
      }
    } catch (err) {
      console.error("Update movie error:", err);

      setError(
        err.response?.data?.message || err.message || "Failed to update movie.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08080c] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <PencilIcon />
            </div>

            <div>
              <h2 className="text-xl font-bold">Edit Movie</h2>

              <p className="text-sm text-gray-500">Update movie information</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          {loadingMeta ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 size={22} className="animate-spin" />
                Loading...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* BASIC */}

              <section>
                <h3 className="mb-4 text-base font-semibold">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* TITLE */}

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm text-gray-300">
                      Movie Title
                    </label>

                    <input
                      name="title"
                      type="text"
                      value={form.title}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm text-gray-300">
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows={5}
                      value={form.description}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                      disabled={loading}
                    />
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Category
                    </label>

                    <DarkSelect
                      value={form.categoryId}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          categoryId: value,
                        }))
                      }
                      options={categoryOptions}
                      placeholder="Select Category"
                      disabled={loading}
                    />
                  </div>

                  {/* GENRES */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Genres
                    </label>

                    <DarkMultiSelect
                      values={form.genreIds}
                      onChange={(values) =>
                        setForm((prev) => ({
                          ...prev,
                          genreIds: values,
                        }))
                      }
                      options={genreOptions}
                    />
                  </div>
                </div>
              </section>

              {/* DETAILS */}

              <section>
                <h3 className="mb-4 text-base font-semibold">Movie Details</h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* YEAR */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Release Year
                    </label>

                    <DarkSelect
                      value={form.releaseYear}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          releaseYear: value,
                        }))
                      }
                      options={yearOptions}
                      placeholder="Select Year"
                      disabled={loading}
                    />
                  </div>

                  {/* DURATION */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Duration
                    </label>

                    <input
                      type="number"
                      name="duration"
                      min="1"
                      value={form.duration}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>

                  {/* LANGUAGE */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Language
                    </label>

                    <DarkSelect
                      value={form.language}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          language: value,
                        }))
                      }
                      options={languageOptions}
                      placeholder="Select Language"
                      disabled={loading}
                    />
                  </div>

                  {/* AGE */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Age Rating
                    </label>

                    <DarkSelect
                      value={form.ageRating}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          ageRating: value,
                        }))
                      }
                      options={ageRatingOptions}
                      placeholder="Select Rating"
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* IMAGES */}

              <section>
                <h3 className="mb-4 text-base font-semibold">Movie Images</h3>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* POSTER */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Poster
                    </label>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                      {posterPreview ? (
                        <div className="relative">
                          <img
                            src={posterPreview}
                            alt="Poster"
                            className="h-[360px] w-full object-cover"
                          />

                          {/* REMOVE / RESET */}

                          <button
                            type="button"
                            onClick={handleRemovePoster}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white transition hover:bg-black"
                          >
                            <X size={16} />
                          </button>

                          {/* CHANGE IMAGE */}

                          <label className="absolute bottom-4 right-4 cursor-pointer">
                            <span className="inline-flex items-center gap-2 rounded-lg bg-black/80 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black">
                              <Upload size={14} />
                              Change Poster
                            </span>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePosterChange}
                              className="hidden"
                              disabled={loading}
                            />
                          </label>

                          {/* NEW FILE NAME */}

                          {posterFile && (
                            <div className="absolute bottom-4 left-4 max-w-[60%] rounded-lg bg-black/80 px-3 py-2 backdrop-blur-sm">
                              <p className="truncate text-xs text-gray-300">
                                {posterFile.name}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex h-[360px] cursor-pointer flex-col items-center justify-center">
                          <ImageIcon size={28} className="mb-3 text-gray-500" />

                          <p className="text-sm text-white">Upload Poster</p>

                          <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
                            <Upload size={14} />
                            Choose Image
                          </span>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterChange}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* BACKDROP */}

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Backdrop
                    </label>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                      {backdropPreview ? (
                        <div className="relative">
                          <img
                            src={backdropPreview}
                            alt="Backdrop"
                            className="h-[360px] w-full object-cover"
                          />

                          {/* REMOVE / RESET */}

                          <button
                            type="button"
                            onClick={handleRemoveBackdrop}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white transition hover:bg-black"
                          >
                            <X size={16} />
                          </button>

                          {/* CHANGE IMAGE */}

                          <label className="absolute bottom-4 right-4 cursor-pointer">
                            <span className="inline-flex items-center gap-2 rounded-lg bg-black/80 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black">
                              <Upload size={14} />
                              Change Backdrop
                            </span>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackdropChange}
                              className="hidden"
                              disabled={loading}
                            />
                          </label>

                          {backdropFile && (
                            <div className="absolute bottom-4 left-4 max-w-[60%] rounded-lg bg-black/80 px-3 py-2 backdrop-blur-sm">
                              <p className="truncate text-xs text-gray-300">
                                {backdropFile.name}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex h-[360px] cursor-pointer flex-col items-center justify-center">
                          <ImageIcon size={28} className="mb-3 text-gray-500" />

                          <p className="text-sm text-white">Upload Backdrop</p>

                          <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
                            <Upload size={14} />
                            Choose Image
                          </span>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackdropChange}
                            className="hidden"
                            disabled={loading}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   PENCIL ICON
========================================================= */

const PencilIcon = () => {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
};

export default AdminEditMovie;
