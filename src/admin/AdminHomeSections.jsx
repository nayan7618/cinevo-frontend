import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  X,
  GripVertical,
  Film,
  Tv,
  Tags,
  Languages,
  Star,
  Clock3,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const TYPE_OPTIONS = [
  {
    value: "TRENDING",
    label: "Trending",
  },
  {
    value: "POPULAR",
    label: "Popular",
  },
  {
    value: "LATEST",
    label: "Latest",
  },
  {
    value: "RECOMMENDED",
    label: "Recommended",
  },
  {
    value: "CATEGORY",
    label: "Category",
  },
  {
    value: "GENRE",
    label: "Genre",
  },
  {
    value: "LANGUAGE",
    label: "Language",
  },
  {
    value: "AGE_RATING",
    label: "Age Rating",
  },
];

const CONTENT_OPTIONS = [
  {
    value: "MOVIES",
    label: "Movies",
  },
  {
    value: "SERIES",
    label: "Series",
  },
  {
    value: "BOTH",
    label: "Movies + Series",
  },
];

const DEFAULT_FORM = {
  title: "",
  subtitle: "",
  type: "CATEGORY",
  contentType: "MOVIES",
  categoryId: "",
  genreId: "",
  filterValue: "",
  itemLimit: 10,
  sortOrder: 0,
};

const getTypeLabel = (type) => {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label || type;
};

const getContentLabel = (type) => {
  return CONTENT_OPTIONS.find((item) => item.value === type)?.label || type;
};

const AdminHomeSections = () => {
  const [sections, setSections] = useState([]);

  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [form, setForm] = useState(DEFAULT_FORM);

  // =====================================================
  // FETCH
  // =====================================================

  const fetchData = async (showRefresh = false) => {
    try {
      setError("");
      setSuccess("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [sectionsResponse, optionsResponse] = await Promise.all([
        api.get(`/admin/home-sections`),

        api.get(`/admin/home-sections/options`),
      ]);

      if (!sectionsResponse.data?.success) {
        throw new Error(
          sectionsResponse.data?.message || "Failed to load home sections",
        );
      }

      if (!optionsResponse.data?.success) {
        throw new Error(
          optionsResponse.data?.message ||
            "Failed to load home section options",
        );
      }

      setSections(
        Array.isArray(sectionsResponse.data.sections)
          ? sectionsResponse.data.sections
          : [],
      );

      setCategories(
        Array.isArray(optionsResponse.data.categories)
          ? optionsResponse.data.categories
          : [],
      );

      setGenres(
        Array.isArray(optionsResponse.data.genres)
          ? optionsResponse.data.genres
          : [],
      );
    } catch (err) {
      console.error("Home sections fetch error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load home sections",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FORM HELPERS
  // =====================================================

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingSection(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setForm({
      ...DEFAULT_FORM,
      sortOrder: sections.length,
    });

    setEditingSection(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (section) => {
    setForm({
      title: section.title || "",
      subtitle: section.subtitle || "",
      type: section.type || "CATEGORY",
      contentType: section.contentType || "MOVIES",
      categoryId: section.categoryId || "",
      genreId: section.genreId || "",
      filterValue: section.filterValue || "",
      itemLimit: section.itemLimit || 10,
      sortOrder: section.sortOrder || 0,
    });

    setEditingSection(section);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,

        type: form.type,
        contentType: form.contentType,

        categoryId: form.type === "CATEGORY" ? form.categoryId || null : null,

        genreId: form.type === "GENRE" ? form.genreId || null : null,

        filterValue:
          form.type === "LANGUAGE" || form.type === "AGE_RATING"
            ? form.filterValue.trim()
            : null,

        itemLimit: Number(form.itemLimit),

        sortOrder: Number(form.sortOrder),
      };

      let response;

      if (editingSection?.id) {
        response = await api.patch(
          `/admin/home-sections/${editingSection.id}`,
          payload,
        );
      } else {
        response = await api.post(`/admin/home-sections`, payload);
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Failed to save home section",
        );
      }

      setSuccess(
        editingSection
          ? "Home section updated successfully."
          : "Home section created successfully.",
      );

      resetForm();

      await fetchData();
    } catch (err) {
      console.error("Save home section error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save home section",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE
  // =====================================================

  const handleToggle = async (section) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/admin/home-sections/${section.id}/toggle`,
        {},
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to update section");
      }

      await fetchData();
    } catch (err) {
      console.error("Toggle home section error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update section",
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (section) => {
    const confirmed = window.confirm(`Delete "${section.title}" from Home?`);

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/admin/home-sections/${section.id}`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to delete section");
      }

      setSuccess("Home section deleted successfully.");

      await fetchData();
    } catch (err) {
      console.error("Delete home section error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete section",
      );
    }
  };

  // =====================================================
  // SORTED SECTIONS
  // =====================================================

  const sortedSections = useMemo(() => {
    return [...sections].sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
    );
  }, [sections]);

  // =====================================================
  // REORDER
  // =====================================================

  const handleReorder = async (index, direction) => {
    if (reordering) return;

    const newSections = [...sortedSections];

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Boundary check
    if (targetIndex < 0 || targetIndex >= newSections.length) {
      return;
    }

    // Swap
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    // Normalize sort order
    const reorderedSections = newSections.map((section, position) => ({
      id: section.id,
      sortOrder: position,
    }));

    // Instant UI update
    setSections(
      newSections.map((section, position) => ({
        ...section,
        sortOrder: position,
      })),
    );

    try {
      setReordering(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/admin/home-sections/reorder`,
        {
          sections: reorderedSections,
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to reorder sections");
      }

      setSuccess("Home section order updated successfully.");

      // Server state sync
      await fetchData();
    } catch (err) {
      console.error("Reorder home sections error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reorder sections",
      );

      // Restore actual server order
      await fetchData();
    } finally {
      setReordering(false);
    }
  };

  // =====================================================
  // ICON
  // =====================================================

  const getSectionIcon = (section) => {
    if (section.contentType === "SERIES") {
      return <Tv size={18} />;
    }

    if (section.type === "GENRE") {
      return <Tags size={18} />;
    }

    if (section.type === "LANGUAGE") {
      return <Languages size={18} />;
    }

    if (section.type === "LATEST") {
      return <Clock3 size={18} />;
    }

    if (section.type === "RECOMMENDED") {
      return <Sparkles size={18} />;
    }

    if (section.type === "POPULAR") {
      return <Star size={18} />;
    }

    return <Film size={18} />;
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <RefreshCw size={30} className="animate-spin text-red-500" />

        <p className="mt-4 text-sm text-zinc-500">Loading Home Sections...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-[calc(100dvh-8rem)] text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <Sparkles size={21} className="text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Home Sections</h1>

              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                Control what appears on the Cinevo Home page
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing || reordering}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={reordering}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            <Plus size={17} />
            Add Section
          </button>
        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* =================================================
          ADD / EDIT FORM
      ================================================= */}

      {showForm && (
        <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold">
                {editingSection ? "Edit Home Section" : "Add Home Section"}
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Configure the section shown on Home
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-6">
            {/* TITLE */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Section Title
                </label>

                <input
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Bollywood Movies"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/40"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Subtitle
                </label>

                <input
                  value={form.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="Latest Bollywood movies"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/40"
                />
              </div>
            </div>

            {/* TYPE */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Section Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) => {
                    updateField("type", e.target.value);

                    updateField("categoryId", "");

                    updateField("genreId", "");

                    updateField("filterValue", "");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#121217] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Content
                </label>

                <select
                  value={form.contentType}
                  onChange={(e) => updateField("contentType", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121217] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                >
                  {CONTENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CATEGORY */}

            {form.type === "CATEGORY" && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Category
                </label>

                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121217] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                  required
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GENRE */}

            {form.type === "GENRE" && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Genre
                </label>

                <select
                  value={form.genreId}
                  onChange={(e) => updateField("genreId", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121217] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                  required
                >
                  <option value="">Select Genre</option>

                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LANGUAGE / AGE */}

            {(form.type === "LANGUAGE" || form.type === "AGE_RATING") && (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  {form.type === "LANGUAGE" ? "Language" : "Age Rating"}
                </label>

                <input
                  value={form.filterValue}
                  onChange={(e) => updateField("filterValue", e.target.value)}
                  placeholder={form.type === "LANGUAGE" ? "Hindi" : "18+"}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/40"
                  required
                />
              </div>
            )}

            {/* LIMIT / ORDER */}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Items to Show
                </label>

                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.itemLimit}
                  onChange={(e) => updateField("itemLimit", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">
                  Display Order
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => updateField("sortOrder", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-red-500/40"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-5">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}

                {editingSection ? "Update Section" : "Create Section"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =================================================
          SECTIONS
      ================================================= */}

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Active Home Configuration</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Change the order and visibility of Home sections
          </p>
        </div>

        {sortedSections.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Sparkles size={30} className="mx-auto text-zinc-700" />

            <p className="mt-4 text-sm text-zinc-500">
              No Home sections configured yet.
            </p>

            <button
              type="button"
              onClick={openCreate}
              className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold hover:bg-red-500"
            >
              Add First Section
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {sortedSections.map((section, index) => {
              const isFirst = index === 0;
              const isLast = index === sortedSections.length - 1;

              return (
                <div
                  key={section.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <GripVertical
                      size={18}
                      className="shrink-0 text-zinc-700"
                    />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                      {getSectionIcon(section)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {section.title}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {getTypeLabel(section.type)}
                        {" • "}
                        {getContentLabel(section.contentType)}
                        {" • "}
                        {section.itemLimit} items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ==========================
                          MOVE UP
                      ========================== */}

                    <button
                      type="button"
                      onClick={() => handleReorder(index, "up")}
                      disabled={isFirst || reordering}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      title="Move Up"
                    >
                      <ChevronUp size={17} />
                    </button>

                    {/* ==========================
                          MOVE DOWN
                      ========================== */}

                    <button
                      type="button"
                      onClick={() => handleReorder(index, "down")}
                      disabled={isLast || reordering}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      title="Move Down"
                    >
                      <ChevronDown size={17} />
                    </button>

                    {/* ==========================
                          ACTIVE / INACTIVE
                      ========================== */}

                    <button
                      type="button"
                      onClick={() => handleToggle(section)}
                      disabled={reordering}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
                        section.isActive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {section.isActive ? "ON" : "OFF"}
                    </button>

                    {/* ==========================
                          EDIT
                      ========================== */}

                    <button
                      type="button"
                      onClick={() => openEdit(section)}
                      disabled={reordering}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-400 disabled:opacity-40"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* ==========================
                          DELETE
                      ========================== */}

                    <button
                      type="button"
                      onClick={() => handleDelete(section)}
                      disabled={reordering}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminHomeSections;
