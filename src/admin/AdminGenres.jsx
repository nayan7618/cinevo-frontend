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
  List,
  Folder,
  Hash,
  ChevronRight,
} from "lucide-react";

const AdminGenres = () => {
  const [activeTab, setActiveTab] = useState("genres");

  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      imageUrl: "",
    });

    setEditingItem(null);
  };

  // =====================================================
  // FETCH GENRES
  // =====================================================

  const fetchGenres = useCallback(async () => {
    const response = await api.get(`/genres`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch genres");
    }

    const list =
      response.data?.genres ||
      response.data?.data?.genres ||
      response.data?.data ||
      [];

    setGenres(Array.isArray(list) ? list : []);
  }, []);

  // =====================================================
  // FETCH CATEGORIES
  // =====================================================

  const fetchCategories = useCallback(async () => {
    const response = await api.get(`/categories`);

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to fetch categories");
    }

    const list =
      response.data?.categories ||
      response.data?.data?.categories ||
      response.data?.data ||
      [];

    setCategories(Array.isArray(list) ? list : []);
  }, []);

  // =====================================================
  // FETCH ALL DATA
  // =====================================================

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        await Promise.all([fetchGenres(), fetchCategories()]);
      } catch (err) {
        console.error(
          "Admin genres/categories fetch error:",
          err.response?.data || err,
        );

        setError(
          err.response?.data?.message || err.message || "Failed to load data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchGenres, fetchCategories],
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAdd = () => {
    resetForm();
    setShowForm(true);
    setError("");
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEdit = (item) => {
    setEditingItem(item);

    setForm({
      name: item?.name || "",
      description: item?.description || "",
      imageUrl: item?.imageUrl || "",
    });

    setShowForm(true);
    setError("");
  };

  // =====================================================
  // CLOSE FORM
  // =====================================================

  const closeForm = () => {
    if (actionLoading === "save") return;

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // INPUT HANDLER
  // =====================================================

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Name is required");
      return;
    }

    try {
      setActionLoading("save");
      setError("");

      if (activeTab === "genres") {
        if (editingItem) {
          await api.patch(`/genres/${editingItem.id}`, {
            name,
          });
        } else {
          await api.post(`/genres`, {
            name,
          });
        }

        await fetchGenres();
      } else {
        const payload = {
          name,
        };

        if (form.description.trim()) {
          payload.description = form.description.trim();
        }

        if (form.imageUrl.trim()) {
          payload.imageUrl = form.imageUrl.trim();
        }

        if (editingItem) {
          await api.patch(`/categories/${editingItem.id}`, payload);
        } else {
          await api.post(`/categories`, payload);
        }

        await fetchCategories();
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Save error:", err.response?.data || err);

      setError(err.response?.data?.message || err.message || "Failed to save");
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (item) => {
    const type = activeTab === "genres" ? "genre" : "category";

    const confirmed = window.confirm(
      `Are you sure you want to delete ${type} "${item.name}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${item.id}`);
      setError("");

      if (activeTab === "genres") {
        await api.delete(`/genres/${item.id}`);

        await fetchGenres();
      } else {
        await api.delete(`/categories/${item.id}`);

        await fetchCategories();
      }
    } catch (err) {
      console.error("Delete error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to delete ${type}`,
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // TAB CHANGE
  // =====================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setError("");

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // CURRENT DATA
  // =====================================================

  const currentData = activeTab === "genres" ? genres : categories;

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return currentData;

    return currentData.filter((item) =>
      String(item?.name || "")
        .toLowerCase()
        .includes(query),
    );
  }, [currentData, search]);

  // =====================================================
  // COUNTS
  // =====================================================

  const totalCount = activeTab === "genres" ? genres.length : categories.length;

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
            {/* TITLE */}

            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                {activeTab === "genres" ? (
                  <List size={21} className="text-red-500" />
                ) : (
                  <Folder size={21} className="text-red-500" />
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  Genres & Categories
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Organize and manage your content
                </p>
              </div>
            </div>

            {/* HEADER ACTIONS */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                title="Refresh"
                className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing ? "animate-spin text-gray-500" : "text-gray-300"
                  }
                />
              </button>

              <button
                type="button"
                onClick={openAdd}
                className="h-11 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/10 transition"
              >
                <Plus size={18} />

                <span>Add {activeTab === "genres" ? "Genre" : "Category"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="min-h-[calc(100dvh-89px)] bg-[#090909] px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-[1600px] mx-auto">
          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />

              <p className="flex-1 text-sm font-medium text-red-400 leading-5">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-gray-500 hover:text-white transition shrink-0"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* =================================================
              TOP STATS
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {/* ACTIVE */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Current Section
                  </p>

                  <p className="text-lg sm:text-xl font-semibold mt-2">
                    {activeTab === "genres" ? "Genres" : "Categories"}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/10 flex items-center justify-center">
                  {activeTab === "genres" ? (
                    <List size={18} className="text-red-400" />
                  ) : (
                    <Folder size={18} className="text-red-400" />
                  )}
                </div>
              </div>
            </div>

            {/* TOTAL */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Total
                  </p>

                  <p className="text-2xl font-bold mt-2">{totalCount}</p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                  <Hash size={18} className="text-gray-300" />
                </div>
              </div>
            </div>

            {/* SEARCH RESULT */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                    Showing
                  </p>

                  <p className="text-2xl font-bold mt-2">
                    {filteredData.length}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center">
                  <Search size={18} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              TABS + SEARCH
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-3 mb-5">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* TABS */}

              <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => handleTabChange("genres")}
                  className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === "genres"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <List size={16} />
                    Genres
                    <span className="text-xs opacity-70">{genres.length}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("categories")}
                  className={`flex-1 lg:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === "categories"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/10"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Folder size={16} />
                    Categories
                    <span className="text-xs opacity-70">
                      {categories.length}
                    </span>
                  </span>
                </button>
              </div>

              {/* SEARCH */}

              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
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
            </div>
          </div>

          {/* =================================================
              LIST CARD
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] overflow-hidden">
            {/* LIST HEADER */}

            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-white">
                  {activeTab === "genres" ? "All Genres" : "All Categories"}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {filteredData.length}{" "}
                  {activeTab === "genres" ? "genres" : "categories"} found
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active
              </div>
            </div>

            {/* LOADING */}

            {loading ? (
              <div className="min-h-[420px] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/10 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-red-500" />
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  Loading {activeTab}...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              /* EMPTY */

              <div className="min-h-[420px] flex flex-col items-center justify-center text-center px-5">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.035] border border-white/[0.07] flex items-center justify-center mb-4">
                  {activeTab === "genres" ? (
                    <List size={27} className="text-gray-600" />
                  ) : (
                    <Folder size={27} className="text-gray-600" />
                  )}
                </div>

                <h3 className="text-lg font-semibold">No {activeTab} found</h3>

                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  {search
                    ? `No ${activeTab} match "${search}".`
                    : `You haven't created any ${activeTab} yet.`}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium transition"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="mt-5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <Plus size={16} />
                    Add {activeTab === "genres" ? "Genre" : "Category"}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* DESKTOP */}

                <div className="hidden md:block">
                  {filteredData.map((item, index) => {
                    const deleting = actionLoading === `delete-${item.id}`;

                    return (
                      <div
                        key={item.id}
                        className="px-5 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.018] transition"
                      >
                        <div className="flex items-center gap-4">
                          {/* NUMBER */}

                          <div className="w-9 h-9 rounded-lg bg-white/[0.035] border border-white/[0.06] flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-gray-500">
                              {index + 1}
                            </span>
                          </div>

                          {/* CATEGORY IMAGE */}

                          {activeTab === "categories" && item.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          {/* ICON */}

                          {activeTab === "genres" && (
                            <div className="w-12 h-12 rounded-xl bg-red-500/[0.07] border border-red-500/10 flex items-center justify-center shrink-0">
                              <List size={18} className="text-red-400" />
                            </div>
                          )}

                          {/* INFO */}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-white truncate">
                                {item.name}
                              </h3>

                              <span className="px-2 py-1 rounded-md border border-emerald-500/10 bg-emerald-500/[0.06] text-[10px] font-semibold text-emerald-400">
                                ACTIVE
                              </span>
                            </div>

                            {activeTab === "categories" && item.description && (
                              <p className="text-xs text-gray-500 mt-1.5 truncate max-w-xl">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* ID */}

                          <div className="hidden xl:block text-[11px] text-gray-600 max-w-[150px] truncate">
                            {item.id}
                          </div>

                          {/* ACTIONS */}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEdit(item)}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.025] hover:bg-yellow-500/10 hover:border-yellow-500/20 hover:text-yellow-400 text-gray-400 flex items-center justify-center transition"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              title="Delete"
                              onClick={() => handleDelete(item)}
                              disabled={deleting}
                              className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.025] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition disabled:opacity-50"
                            >
                              {deleting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE */}

                <div className="md:hidden divide-y divide-white/[0.05]">
                  {filteredData.map((item, index) => {
                    const deleting = actionLoading === `delete-${item.id}`;

                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start gap-3">
                          {activeTab === "categories" && item.imageUrl ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-red-500/[0.07] border border-red-500/10 flex items-center justify-center shrink-0">
                              {activeTab === "genres" ? (
                                <List size={18} className="text-red-400" />
                              ) : (
                                <Folder size={18} className="text-red-400" />
                              )}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-600">
                                #{index + 1}
                              </span>

                              <h3 className="font-semibold text-sm truncate">
                                {item.name}
                              </h3>
                            </div>

                            {activeTab === "categories" && item.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-yellow-500/10 hover:text-yellow-400 text-gray-400 flex items-center justify-center gap-2 text-sm transition"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deleting}
                            className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:text-red-400 text-gray-400 flex items-center justify-center gap-2 text-sm transition disabled:opacity-50"
                          >
                            {deleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={closeForm} />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}

            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {activeTab === "genres" ? (
                    <List size={17} className="text-red-400" />
                  ) : (
                    <Folder size={17} className="text-red-400" />
                  )}

                  <h2 className="text-lg font-semibold truncate">
                    {editingItem ? "Edit" : "Add"}{" "}
                    {activeTab === "genres" ? "Genre" : "Category"}
                  </h2>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {editingItem
                    ? "Update existing information"
                    : "Create a new content classification"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={actionLoading === "save"}
                className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form onSubmit={handleSubmit} className="p-5">
              {/* NAME */}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Name
                  <span className="text-red-400 ml-1">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={
                    activeTab === "genres" ? "e.g. Action" : "e.g. Movies"
                  }
                  autoFocus
                  className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition"
                />
              </div>

              {/* CATEGORY EXTRA FIELDS */}

              {activeTab === "categories" && (
                <>
                  {/* DESCRIPTION */}

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      placeholder="Describe this category..."
                      className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 resize-none transition"
                    />
                  </div>

                  {/* IMAGE URL */}

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      Image URL
                    </label>

                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) =>
                        handleInputChange("imageUrl", e.target.value)
                      }
                      placeholder="https://..."
                      className="w-full h-11 px-3.5 rounded-xl border border-white/10 bg-white/[0.035] text-white placeholder:text-gray-600 outline-none focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 transition"
                    />
                  </div>

                  {/* IMAGE PREVIEW */}

                  {form.imageUrl.trim() && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 mb-2">
                        Preview
                      </p>

                      <div className="h-32 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* FOOTER */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={actionLoading === "save"}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading === "save" || !form.name.trim()}
                  className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === "save" && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {editingItem ? "Update" : "Create"}

                  {!actionLoading && <ChevronRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          EXTRA BOTTOM DARK AREA
          Prevents white strip from parent/body
      ================================================= */}

      <div className="h-6 bg-[#090909]" />
    </div>
  );
};

export default AdminGenres;
