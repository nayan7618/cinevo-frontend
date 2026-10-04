import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api"
import {
  X,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Film,
  Loader2,
  Check,
} from "lucide-react";

const R2_PUBLIC_URL =
  import.meta.env.VITE_R2_PUBLIC_URL || "";

/* =========================================================
   DARK SINGLE SELECT
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
    (option) => String(option.value) === String(value)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full min-h-[46px] rounded-xl border border-white/10
          bg-[#111111] px-4 py-3 text-left text-sm text-white
          flex items-center justify-between gap-3
          transition-all
          ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:border-white/20"
          }`}
      >
        <span
          className={
            selectedOption ? "text-white" : "text-gray-500"
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const selected =
                  String(option.value) === String(value);

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition
                      ${
                        selected
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <span>{option.label}</span>

                    {selected && (
                      <Check size={16} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   DARK MULTI SELECT
========================================================= */

const DarkMultiSelect = ({
  values,
  onChange,
  options,
  placeholder = "Select genres",
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

  const toggleValue = (id) => {
    const exists = values.includes(id);

    if (exists) {
      onChange(values.filter((item) => item !== id));
    } else {
      onChange([...values, id]);
    }
  };

  const selectedOptions = options.filter((option) =>
    values.includes(option.value)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111111] px-4 py-2.5 text-left transition hover:border-white/20"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-gray-500">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white"
              >
                {option.label}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(option.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleValue(option.value);
                    }
                  }}
                  className="cursor-pointer text-gray-400 hover:text-white"
                >
                  <X size={13} />
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
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111111] shadow-2xl">
          <div className="max-h-64 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                No genres available
              </div>
            ) : (
              options.map((option) => {
                const selected = values.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition
                      ${
                        selected
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <span>{option.label}</span>

                    {selected && <Check size={16} />}
                  </button>
                );
              })
            )}
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
   MAIN COMPONENT
========================================================= */

const AdminAddMovie = ({
  onClose,
  onMovieCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);

  const [posterFile, setPosterFile] = useState(null);
  const [backdropFile, setBackdropFile] = useState(null);

  const [posterPreview, setPosterPreview] = useState("");
  const [backdropPreview, setBackdropPreview] = useState("");

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
     YEARS
  ========================================================= */

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
     STATIC OPTIONS
  ========================================================= */

  const languageOptions = [
    {
      value: "English",
      label: "English",
    },
    {
      value: "Hindi",
      label: "Hindi",
    },
    {
      value: "Bengali",
      label: "Bengali",
    },
    {
      value: "Tamil",
      label: "Tamil",
    },
    {
      value: "Telugu",
      label: "Telugu",
    },
    {
      value: "Malayalam",
      label: "Malayalam",
    },
    {
      value: "Kannada",
      label: "Kannada",
    },
    {
      value: "Marathi",
      label: "Marathi",
    },
    {
      value: "Punjabi",
      label: "Punjabi",
    },
    {
      value: "Gujarati",
      label: "Gujarati",
    },
  ];

  const ageRatingOptions = [
    {
      value: "U",
      label: "U",
    },
    {
      value: "UA",
      label: "UA",
    },
    {
      value: "A",
      label: "A",
    },
    {
      value: "13+",
      label: "13+",
    },
    {
      value: "16+",
      label: "16+",
    },
    {
      value: "18+",
      label: "18+",
    },
  ];

  /* =========================================================
     FETCH CATEGORIES + GENRES
  ========================================================= */

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        setError("");

        const [categoryResponse, genreResponse] =
          await Promise.all([
            api.get(`/categories`),
            api.get(`/genres`,),
          ]);

        const categoryData = categoryResponse?.data;
        const genreData = genreResponse?.data;

        const fetchedCategories =
          categoryData?.categories ||
          categoryData?.data ||
          (Array.isArray(categoryData)
            ? categoryData
            : []);

        const fetchedGenres =
          genreData?.genres ||
          genreData?.data ||
          (Array.isArray(genreData)
            ? genreData
            : []);

        setCategories(fetchedCategories);
        setGenres(fetchedGenres);
      } catch (err) {
        console.error(
          "Fetch movie metadata error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Failed to load categories and genres."
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, []);

  /* =========================================================
     CATEGORY OPTIONS
  ========================================================= */

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  /* =========================================================
     GENRE OPTIONS
  ========================================================= */

  const genreOptions = useMemo(() => {
    return genres.map((genre) => ({
      value: genre.id,
      label: genre.name,
    }));
  }, [genres]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     POSTER SELECT
  ========================================================= */

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Poster must be an image file.");
      return;
    }

    setPosterFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);
  };

  /* =========================================================
     BACKDROP SELECT
  ========================================================= */

  const handleBackdropChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Backdrop must be an image file.");
      return;
    }

    setBackdropFile(file);

    const previewUrl = URL.createObjectURL(file);
    setBackdropPreview(previewUrl);
  };

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview("");
  };

  const removeBackdrop = () => {
    setBackdropFile(null);
    setBackdropPreview("");
  };

  /* =========================================================
     UPLOAD IMAGE TO R2
  ========================================================= */

  const uploadMovieImage = async ({
  movieId,
  file,
  imageType,
}) => {
  if (!file) return null;

  // 1. Backend থেকে presigned URL নাও
  const uploadResponse = await api.post(
    "/uploads/movie-image",
    {
      movieId,
      fileName: file.name,
      contentType: file.type,
      imageType,
    },
  );

  const uploadData = uploadResponse?.data;

  if (!uploadData?.uploadUrl || !uploadData?.key) {
    throw new Error(
      `Failed to generate ${imageType} upload URL.`
    );
  }

  // 2. Direct R2 upload
  const r2UploadResponse = await fetch(
    uploadData.uploadUrl,
    {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    }
  );

  if (!r2UploadResponse.ok) {
    throw new Error(
      `Image upload failed (${r2UploadResponse.status})`
    );
  }

  const publicBase = R2_PUBLIC_URL.replace(/\/$/, "");

  const publicUrl = publicBase
    ? `${publicBase}/${uploadData.key}`
    : "";

  return {
    key: uploadData.key,
    url: publicUrl,
  };
};

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 2) {
      return "Movie title must be at least 2 characters.";
    }

    if (description.length < 10) {
      return "Description must be at least 10 characters.";
    }

    if (!form.categoryId) {
      return "Please select a category.";
    }

    if (!form.genreIds.length) {
      return "Please select at least one genre.";
    }

    if (!form.releaseYear) {
      return "Please select release year.";
    }

    const releaseYear = Number(form.releaseYear);

    if (!Number.isInteger(releaseYear)) {
      return "Invalid release year.";
    }

    if (!form.duration) {
      return "Please enter movie duration.";
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

      /* -----------------------------------------------------
         STEP 1: CREATE MOVIE
      ----------------------------------------------------- */

      const moviePayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        releaseYear: Number(form.releaseYear),
        duration: Number(form.duration),
        language: form.language.trim(),
        ageRating: form.ageRating.trim(),
        categoryId: form.categoryId,
        genreIds: form.genreIds,
      };

      const movieResponse = await api.post(
        `/movies`,
        moviePayload,
      );

      const movieData = movieResponse?.data;

      const movie = movieData?.movie;

      if (!movie?.id) {
        throw new Error(
          "Movie was created but movie ID was not returned."
        );
      }

      /* -----------------------------------------------------
         STEP 2: UPLOAD POSTER
      ----------------------------------------------------- */

      let posterUpload = null;
      let backdropUpload = null;

      if (posterFile) {
        posterUpload = await uploadMovieImage({
          movieId: movie.id,
          file: posterFile,
          imageType: "poster",
        });
      }

      /* -----------------------------------------------------
         STEP 3: UPLOAD BACKDROP
      ----------------------------------------------------- */

      if (backdropFile) {
        backdropUpload = await uploadMovieImage({
          movieId: movie.id,
          file: backdropFile,
          imageType: "backdrop",
        });
      }

      /* -----------------------------------------------------
         STEP 4: UPDATE MOVIE IMAGE URLS
      ----------------------------------------------------- */

      const imageUpdatePayload = {};

      if (posterUpload?.url) {
        imageUpdatePayload.posterUrl =
          posterUpload.url;
      }

      if (backdropUpload?.url) {
        imageUpdatePayload.backdropUrl =
          backdropUpload.url;
      }

      let finalMovie = movie;

      if (Object.keys(imageUpdatePayload).length > 0) {
        const updateResponse = await api.patch(
          `/movies/${movie.id}`,
          imageUpdatePayload,
        );

        finalMovie =
          updateResponse?.data?.movie ||
          updateResponse?.data ||
          movie;
      }

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      setSuccess(
        "Movie created successfully."
      );

      if (typeof onMovieCreated === "function") {
        onMovieCreated(finalMovie);
      }

      /* -----------------------------------------------------
         RESET FORM
      ----------------------------------------------------- */

      setForm({
        title: "",
        description: "",
        categoryId: "",
        genreIds: [],
        releaseYear: "",
        duration: "",
        language: "English",
        ageRating: "UA",
      });

      setPosterFile(null);
      setBackdropFile(null);
      setPosterPreview("");
      setBackdropPreview("");
    } catch (err) {
      console.error(
        "Create movie error:",
        err
      );

      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create movie.";

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    if (loading) return;

    if (typeof onClose === "function") {
      onClose();
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08080c] shadow-2xl">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
                <Film size={20} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Add Movie
                </h2>

                <p className="text-sm text-gray-500">
                  Create a new movie for CINEBOX
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {/* ===================================================
            BODY
        =================================================== */}

        <div className="flex-1 overflow-y-auto p-6">
          {/* ALERT */}
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
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                Loading categories and genres...
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-7"
            >
              {/* =================================================
                  BASIC INFO
              ================================================= */}

              <section>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Enter the basic movie details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* TITLE */}

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Movie Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Enter movie title"
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Enter movie description"
                      rows={5}
                      className={`${inputClass} resize-none`}
                      disabled={loading}
                    />
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
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

                  {/* GENRE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
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
                      placeholder="Select Genres"
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  MOVIE DETAILS
              ================================================= */}

              <section>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white">
                    Movie Details
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Add release, duration and language information.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* RELEASE YEAR */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
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
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Duration
                      <span className="ml-1 text-xs text-gray-500">
                        (minutes)
                      </span>
                    </label>

                    <input
                      type="number"
                      name="duration"
                      value={form.duration}
                      onChange={handleChange}
                      placeholder="e.g. 120"
                      min="1"
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>

                  {/* LANGUAGE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
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

                  {/* AGE RATING */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
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
                      placeholder="Select Age Rating"
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  IMAGES
              ================================================= */}

              <section>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-white">
                    Movie Images
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Upload poster and backdrop images.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* =================================================
                      POSTER
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Poster
                    </label>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                      {posterPreview ? (
                        <div className="relative">
                          <img
                            src={posterPreview}
                            alt="Poster preview"
                            className="h-[380px] w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={removePoster}
                            disabled={loading}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-sm transition hover:bg-black"
                          >
                            <X size={17} />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                            <p className="truncate text-xs text-gray-300">
                              {posterFile?.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <label className="flex h-[380px] cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-white/[0.02]">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
                            <ImageIcon size={26} />
                          </div>

                          <p className="text-sm font-medium text-white">
                            Upload Poster
                          </p>

                          <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                            Recommended vertical poster image
                          </p>

                          <span className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
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

                  {/* =================================================
                      BACKDROP
                  ================================================= */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Backdrop
                    </label>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                      {backdropPreview ? (
                        <div className="relative">
                          <img
                            src={backdropPreview}
                            alt="Backdrop preview"
                            className="h-[380px] w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={removeBackdrop}
                            disabled={loading}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur-sm transition hover:bg-black"
                          >
                            <X size={17} />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                            <p className="truncate text-xs text-gray-300">
                              {backdropFile?.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <label className="flex h-[380px] cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-white/[0.02]">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
                            <ImageIcon size={26} />
                          </div>

                          <p className="text-sm font-medium text-white">
                            Upload Backdrop
                          </p>

                          <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                            Recommended wide landscape image
                          </p>

                          <span className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300">
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

              {/* =================================================
                  FOOTER INFO
              ================================================= */}

              <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 px-4 py-3">
                <p className="text-xs leading-5 text-gray-400">
                  Movie create hone ke baad uska video
                  <span className="text-gray-200">
                    {" "}
                    Video Manager
                  </span>
                  {" "}se upload/process karna hoga. Movie tab tak
                  publish nahi hogi jab tak READY video available na ho.
                </p>
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || loadingMeta}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Creating Movie...
                    </>
                  ) : (
                    <>
                      <Film size={17} />
                      Create Movie
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

export default AdminAddMovie;