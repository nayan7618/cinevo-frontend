
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

import {
  Search,
  RefreshCw,
  Loader2,
  UserRound,
  ShieldCheck,
  ShieldOff,
  Eye,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Crown,
  PlayCircle,
  Clock3,
  CalendarDays,
  Mail,
} from "lucide-react";

// =====================================================
// HELPERS
// =====================================================

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleString();
  } catch {
    return "—";
  }
};

const formatDateOnly = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "—";
  }
};

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds) || 0;

  if (totalSeconds <= 0) {
    return "0m";
  }

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const secs = Math.floor(
    totalSeconds % 60
  );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${secs}s`;
};

// =====================================================
// MAIN
// =====================================================

const AdminUsers = () => {
  // =====================================================
  // USERS
  // =====================================================

  const [users, setUsers] = useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      totalUsers: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [search, setSearch] =
    useState("");

  const [role, setRole] =
    useState("");

  const [blocked, setBlocked] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  // =====================================================
  // USER DETAIL
  // =====================================================

  const [selectedUser, setSelectedUser] =
    useState(null);

  // =====================================================
  // WATCH HISTORY
  // =====================================================

  const [watchHistory, setWatchHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyPage, setHistoryPage] =
    useState(1);

  const [historyPagination, setHistoryPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = useCallback(
    async (
      page = 1,
      showRefresh = false
    ) => {
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
          params.search =
            search.trim();
        }

        if (role) {
          params.role = role;
        }

        if (blocked !== "") {
          params.blocked =
            blocked;
        }

        const response =
          await api.get(
            "/admin/users",
            {
              params,
            }
          );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to fetch users"
          );
        }

        const userList =
          response.data?.users ||
          response.data?.data?.users ||
          [];

        setUsers(
          Array.isArray(userList)
            ? userList
            : []
        );

        const serverPagination =
          response.data?.pagination ||
          response.data?.data?.pagination;

        if (serverPagination) {
          setPagination(
            serverPagination
          );
        } else {
          setPagination((prev) => ({
            ...prev,
            page,
            totalUsers:
              Array.isArray(userList)
                ? userList.length
                : 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage:
              page > 1,
          }));
        }
      } catch (err) {
        console.error(
          "Admin users fetch error:",
          err.response?.data || err
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to load users"
        );

        setUsers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.limit,
      search,
      role,
      blocked,
    ]
  );

  // =====================================================
  // INITIAL + FILTER LOAD
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [
    search,
    role,
    blocked,
    fetchUsers,
  ]);

  // =====================================================
  // WATCH HISTORY
  // =====================================================

  const fetchWatchHistory = useCallback(
    async (
      userId,
      page = 1
    ) => {
      if (!userId) return;

      try {
        setHistoryLoading(true);
        setError("");

        const response =
          await api.get(
            `/admin/users/${userId}/watch-history`,
            {
              params: {
                page,
                limit: 10,
              },
            }
          );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load watch history"
          );
        }

        const history =
          response.data?.history ||
          response.data?.data?.history ||
          [];

        setWatchHistory(
          Array.isArray(history)
            ? history
            : []
        );

        const serverPagination =
          response.data?.pagination ||
          response.data?.data?.pagination;

        if (serverPagination) {
          setHistoryPagination(
            serverPagination
          );
        } else {
          setHistoryPagination({
            page,
            limit: 10,
            total: history.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage:
              page > 1,
          });
        }

        setHistoryPage(page);
      } catch (err) {
        console.error(
          "Watch history fetch error:",
          err.response?.data || err
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to load watch history"
        );

        setWatchHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    []
  );

  // =====================================================
  // OPEN USER DETAILS
  // =====================================================

  const openUserDetails = async (
    user
  ) => {
    setSelectedUser(user);

    setWatchHistory([]);

    setHistoryPage(1);

    setHistoryPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    await fetchWatchHistory(
      user.id,
      1
    );
  };

  // =====================================================
  // CLOSE USER DETAILS
  // =====================================================

  const closeUserDetails = () => {
    if (historyLoading) return;

    setSelectedUser(null);
    setWatchHistory([]);

    setHistoryPage(1);
  };

  // =====================================================
  // BLOCK / UNBLOCK
  // =====================================================

  const toggleBlock = async (
    user
  ) => {
    if (!user?.id) return;

    if (user.role === "ADMIN") {
      setError(
        "Admin accounts cannot be blocked from this panel."
      );

      return;
    }

    const nextBlocked =
      !user.isBlocked;

    const confirmed =
      window.confirm(
        nextBlocked
          ? `Are you sure you want to block ${user.name}?`
          : `Are you sure you want to unblock ${user.name}?`
      );

    if (!confirmed) return;

    try {
      setActionLoading(
        "block-" + user.id
      );

      setError("");

      await api.patch(
        `/admin/users/${user.id}/block`,
        {
          isBlocked: nextBlocked,
        }
      );

      await fetchUsers(
        pagination.page,
        true
      );

      // Update opened user details
      if (
        selectedUser?.id ===
        user.id
      ) {
        setSelectedUser(
          (prev) =>
            prev
              ? {
                  ...prev,
                  isBlocked:
                    nextBlocked,
                }
              : prev
        );
      }
    } catch (err) {
      console.error(
        "Block/unblock user error:",
        err.response?.data || err
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Failed to update user status"
      );
    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // STATS
  // =====================================================

  const totalUsers =
    pagination.totalUsers || 0;

  const blockedCount = useMemo(
    () =>
      users.filter(
        (user) => user.isBlocked
      ).length,
    [users]
  );

  const activeCount = useMemo(
    () =>
      users.filter(
        (user) => !user.isBlocked
      ).length,
    [users]
  );

  const adminCount = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "ADMIN"
      ).length,
    [users]
  );

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

              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <UserRound
                  size={21}
                  className="text-blue-400"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Users
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Manage Cinevo user accounts
                </p>
              </div>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() =>
                fetchUsers(
                  pagination.page,
                  true
                )
              }
              disabled={refreshing}
              className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition disabled:opacity-50"
              title="Refresh users"
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

          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="min-h-[calc(100dvh-89px)] bg-[#090909] px-4 sm:px-6 lg:px-8 py-6">

        <div className="max-w-[1600px] mx-auto">

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5">

              <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />

              <p className="flex-1 text-sm text-red-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="text-gray-500 hover:text-white transition"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">

            {/* TOTAL */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">

              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                Total Users
              </p>

              <p className="text-2xl font-bold mt-2">
                {totalUsers}
              </p>

            </div>

            {/* ACTIVE */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">

              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                Active
              </p>

              <p className="text-2xl font-bold mt-2 text-emerald-400">
                {activeCount}
              </p>

            </div>

            {/* BLOCKED */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">

              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                Blocked
              </p>

              <p className="text-2xl font-bold mt-2 text-red-400">
                {blockedCount}
              </p>

            </div>

            {/* ADMINS */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">

              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-500">
                Admins
              </p>

              <p className="text-2xl font-bold mt-2">
                {adminCount}
              </p>

            </div>

          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-3 mb-5">

            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search name or email..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 transition"
                />

              </div>

              {/* ROLE */}

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value
                  )
                }
                className="h-11 px-3 rounded-xl border border-white/10 bg-[#161616] text-white outline-none focus:border-blue-500/40"
              >

                <option value="">
                  All Roles
                </option>

                <option value="USER">
                  User
                </option>

                <option value="ADMIN">
                  Admin
                </option>

              </select>

              {/* STATUS */}

              <select
                value={blocked}
                onChange={(e) =>
                  setBlocked(
                    e.target.value
                  )
                }
                className="h-11 px-3 rounded-xl border border-white/10 bg-[#161616] text-white outline-none focus:border-blue-500/40"
              >

                <option value="">
                  All Status
                </option>

                <option value="false">
                  Active
                </option>

                <option value="true">
                  Blocked
                </option>

              </select>

            </div>

          </div>

          {/* =================================================
              USERS TABLE
          ================================================= */}

          <div className="rounded-2xl border border-white/[0.07] bg-[#101010] overflow-hidden">

            {/* HEADER */}

            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

              <div>
                <h2 className="font-semibold">
                  All Users
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {users.length} users on this page
                </p>
              </div>

            </div>

            {/* LOADING */}

            {loading ? (

              <div className="min-h-[430px] flex flex-col items-center justify-center">

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center">

                  <Loader2
                    size={24}
                    className="animate-spin text-blue-400"
                  />

                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Loading users...
                </p>

              </div>

            ) : users.length === 0 ? (

              /* EMPTY */

              <div className="min-h-[430px] flex flex-col items-center justify-center text-center px-5">

                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">

                  <UserRound
                    size={28}
                    className="text-gray-600"
                  />

                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  No users found
                </h3>

                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Try changing your search or filters.
                </p>

              </div>

            ) : (

              <>

                {/* =================================================
                    DESKTOP TABLE
                ================================================= */}

                <div className="hidden lg:block overflow-x-auto">

                  <table className="w-full">

                    <thead>

                      <tr className="border-b border-white/[0.06] text-left">

                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          User
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          Role
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          Subscription
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          Activity
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

                      {users.map(
                        (user) => {

                          const blocking =
                            actionLoading ===
                            "block-" +
                              user.id;

                          return (
                            <tr
                              key={user.id}
                              className="border-b border-white/[0.05] hover:bg-white/[0.02] transition"
                            >

                              {/* USER */}

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-3 min-w-[280px]">

                                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">

                                    <UserRound
                                      size={17}
                                      className="text-gray-400"
                                    />

                                  </div>

                                  <div className="min-w-0">

                                    <p className="font-semibold text-sm text-white truncate">
                                      {user.name ||
                                        "Unknown User"}
                                    </p>

                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                      <Mail
                                        size={11}
                                      />
                                      {user.email}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* ROLE */}

                              <td className="px-5 py-4">

                                {user.role ===
                                "ADMIN" ? (

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-[11px] font-semibold">

                                    <ShieldCheck
                                      size={13}
                                    />

                                    ADMIN

                                  </span>

                                ) : (

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[11px] font-semibold">
                                    USER
                                  </span>

                                )}

                              </td>

                              {/* SUBSCRIPTION */}

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  {user.subscription?.plan &&
                                  user.subscription
                                    ?.plan !==
                                    "FREE" ? (
                                    <Crown
                                      size={15}
                                      className="text-yellow-400"
                                    />
                                  ) : null}

                                  <div>

                                    <p className="text-sm font-medium">
                                      {user.subscription
                                        ?.plan ||
                                        "NONE"}
                                    </p>

                                    <p className="text-[11px] text-gray-500">
                                      {user.subscription
                                        ?.status ||
                                        "—"}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* ACTIVITY */}

                              <td className="px-5 py-4">

                                <div className="text-xs text-gray-400 space-y-1">

                                  <p>
                                    Views:{" "}
                                    <span className="text-gray-200">
                                      {user._count
                                        ?.viewEvents ||
                                        0}
                                    </span>
                                  </p>

                                  <p>
                                    History:{" "}
                                    <span className="text-gray-200">
                                      {user._count
                                        ?.watchHistory ||
                                        0}
                                    </span>
                                  </p>

                                </div>

                              </td>

                              {/* STATUS */}

                              <td className="px-5 py-4">

                                {user.isBlocked ? (

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[11px] font-semibold">

                                    <Ban
                                      size={13}
                                    />

                                    BLOCKED

                                  </span>

                                ) : (

                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">

                                    <CheckCircle2
                                      size={13}
                                    />

                                    ACTIVE

                                  </span>

                                )}

                              </td>

                              {/* ACTIONS */}

                              <td className="px-5 py-4">

                                <div className="flex justify-end gap-2">

                                  {/* VIEW */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openUserDetails(
                                        user
                                      )
                                    }
                                    className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 text-gray-400 flex items-center justify-center transition"
                                    title="View user"
                                  >

                                    <Eye
                                      size={16}
                                    />

                                  </button>

                                  {/* BLOCK */}

                                  {user.role !==
                                    "ADMIN" && (

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleBlock(
                                          user
                                        )
                                      }
                                      disabled={
                                        blocking
                                      }
                                      className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition disabled:opacity-50"
                                      title={
                                        user.isBlocked
                                          ? "Unblock user"
                                          : "Block user"
                                      }
                                    >

                                      {blocking ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : user.isBlocked ? (
                                        <ShieldOff
                                          size={16}
                                        />
                                      ) : (
                                        <Ban
                                          size={16}
                                        />
                                      )}

                                    </button>

                                  )}

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* =================================================
                    MOBILE
                ================================================= */}

                <div className="lg:hidden divide-y divide-white/[0.05]">

                  {users.map(
                    (user) => {

                      const blocking =
                        actionLoading ===
                        "block-" +
                          user.id;

                      return (
                        <div
                          key={user.id}
                          className="p-4"
                        >

                          <div className="flex gap-3">

                            <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">

                              <UserRound
                                size={18}
                                className="text-gray-400"
                              />

                            </div>

                            <div className="flex-1 min-w-0">

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  <h3 className="font-semibold text-sm truncate">
                                    {user.name ||
                                      "Unknown User"}
                                  </h3>

                                  <p className="text-xs text-gray-500 truncate mt-1">
                                    {user.email}
                                  </p>

                                </div>

                                {user.isBlocked ? (

                                  <span className="shrink-0 text-[10px] font-semibold text-red-400">
                                    BLOCKED
                                  </span>

                                ) : (

                                  <span className="shrink-0 text-[10px] font-semibold text-emerald-400">
                                    ACTIVE
                                  </span>

                                )}

                              </div>

                              <div className="flex flex-wrap gap-2 mt-3">

                                <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[10px] text-gray-400">
                                  {user.role}
                                </span>

                                <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[10px] text-gray-400">
                                  {user.subscription
                                    ?.plan ||
                                    "NONE"}
                                </span>

                                <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[10px] text-gray-400">
                                  {user._count
                                    ?.viewEvents ||
                                    0}{" "}
                                  views
                                </span>

                              </div>

                            </div>

                          </div>

                          <div
                            className={`grid gap-2 mt-4 ${
                              user.role ===
                              "ADMIN"
                                ? "grid-cols-1"
                                : "grid-cols-2"
                            }`}
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openUserDetails(
                                  user
                                )
                              }
                              className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-blue-500/10 hover:border-blue-500/20 text-sm text-gray-300 flex items-center justify-center gap-2 transition"
                            >
                              <Eye
                                size={16}
                              />
                              View Details
                            </button>

                            {user.role !==
                              "ADMIN" && (

                              <button
                                type="button"
                                onClick={() =>
                                  toggleBlock(
                                    user
                                  )
                                }
                                disabled={
                                  blocking
                                }
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/20 text-sm text-gray-300 flex items-center justify-center gap-2 transition disabled:opacity-50"
                              >

                                {blocking ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : user.isBlocked ? (
                                  <ShieldOff
                                    size={16}
                                  />
                                ) : (
                                  <Ban
                                    size={16}
                                  />
                                )}

                                {user.isBlocked
                                  ? "Unblock"
                                  : "Block"}

                              </button>

                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="px-5 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <p className="text-xs text-gray-500">
                    Page{" "}
                    <span className="text-gray-300 font-medium">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="text-gray-300 font-medium">
                      {pagination.totalPages ||
                        1}
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
                        fetchUsers(
                          pagination.page -
                            1,
                          true
                        )
                      }
                      className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft
                        size={16}
                      />
                      Prev
                    </button>

                    <button
                      type="button"
                      disabled={
                        !pagination.hasNextPage ||
                        loading
                      }
                      onClick={() =>
                        fetchUsers(
                          pagination.page +
                            1,
                          true
                        )
                      }
                      className="h-9 px-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight
                        size={16}
                      />
                    </button>

                  </div>

                </div>

              </>
            )}

          </div>

        </div>
      </main>

      {/* =================================================
          USER DETAILS MODAL
      ================================================= */}

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

          {/* BACKDROP */}

          <div
            className="absolute inset-0"
            onClick={closeUserDetails}
          />

          {/* MODAL */}

          <div className="relative w-full max-w-3xl max-h-[92dvh] rounded-2xl border border-white/10 bg-[#111111] shadow-2xl overflow-hidden">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="sticky top-0 z-20 px-5 py-4 border-b border-white/[0.06] bg-[#111111]/95 backdrop-blur-xl">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3 min-w-0">

                  <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                    <UserRound
                      size={19}
                      className="text-blue-400"
                    />

                  </div>

                  <div className="min-w-0">

                    <h2 className="text-lg font-semibold truncate">
                      {selectedUser.name ||
                        "User Details"}
                    </h2>

                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {selectedUser.email}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeUserDetails}
                  className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* =================================================
                MODAL BODY
            ================================================= */}

            <div className="overflow-y-auto max-h-[calc(92dvh-74px)] p-5">

              {/* USER STATUS */}

              <div className="flex flex-wrap items-center gap-2 mb-5">

                {selectedUser.role ===
                "ADMIN" ? (

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-[11px] font-semibold">
                    <ShieldCheck
                      size={13}
                    />
                    ADMIN
                  </span>

                ) : (

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[11px] font-semibold">
                    USER
                  </span>

                )}

                {selectedUser.isBlocked ? (

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[11px] font-semibold">
                    <Ban size={13} />
                    BLOCKED
                  </span>

                ) : (

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                    <CheckCircle2
                      size={13}
                    />
                    ACTIVE
                  </span>

                )}

              </div>

              {/* =================================================
                  PROFILE
              ================================================= */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                  <div className="flex items-center gap-2 text-gray-500">
                    <UserRound size={15} />
                    <span className="text-[11px] uppercase tracking-wider">
                      Name
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold">
                    {selectedUser.name ||
                      "—"}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail size={15} />
                    <span className="text-[11px] uppercase tracking-wider">
                      Email
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-300 break-all">
                    {selectedUser.email ||
                      "—"}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays
                      size={15}
                    />
                    <span className="text-[11px] uppercase tracking-wider">
                      Joined
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-300">
                    {formatDateOnly(
                      selectedUser.createdAt
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye size={15} />
                    <span className="text-[11px] uppercase tracking-wider">
                      Total Views
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold">
                    {selectedUser._count
                      ?.viewEvents || 0}
                  </p>

                </div>

              </div>

              {/* =================================================
                  SUBSCRIPTION
              ================================================= */}

              <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

                <div className="flex items-center justify-between gap-3 mb-4">

                  <div className="flex items-center gap-2">

                    <Crown
                      size={16}
                      className="text-yellow-400"
                    />

                    <h3 className="text-sm font-semibold">
                      Subscription
                    </h3>

                  </div>

                  <span className="text-xs text-gray-500">
                    {selectedUser.subscription
                      ?.plan ||
                      "NONE"}
                  </span>

                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-gray-600">
                      Plan
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedUser
                        .subscription
                        ?.plan ||
                        "NONE"}
                    </p>

                  </div>

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-gray-600">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {selectedUser
                        .subscription
                        ?.status ||
                        "—"}
                    </p>

                  </div>

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-gray-600">
                      Start
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                      {formatDateOnly(
                        selectedUser
                          .subscription
                          ?.startDate
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-gray-600">
                      End
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                      {formatDateOnly(
                        selectedUser
                          .subscription
                          ?.endDate
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  ACTIVITY COUNTS
              ================================================= */}

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">
                    Views
                  </p>

                  <p className="mt-1.5 text-xl font-bold">
                    {selectedUser
                      ._count
                      ?.viewEvents ||
                      0}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">
                    History
                  </p>

                  <p className="mt-1.5 text-xl font-bold">
                    {selectedUser
                      ._count
                      ?.watchHistory ||
                      0}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">
                    My List
                  </p>

                  <p className="mt-1.5 text-xl font-bold">
                    {selectedUser
                      ._count
                      ?.myList || 0}
                  </p>

                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">

                  <p className="text-[10px] uppercase tracking-wider text-gray-600">
                    Ratings
                  </p>

                  <p className="mt-1.5 text-xl font-bold">
                    {(selectedUser
                      ._count
                      ?.ratings || 0) +
                      (selectedUser
                        ._count
                        ?.seriesRatings ||
                        0)}
                  </p>

                </div>

              </div>

              {/* =================================================
                  WATCH HISTORY
              ================================================= */}

              <div className="mt-6">

                <div className="flex items-center justify-between gap-3 mb-3">

                  <div>

                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <PlayCircle
                        size={16}
                        className="text-red-400"
                      />
                      Watch History
                    </h3>

                    <p className="text-[11px] text-gray-500 mt-1">
                      {historyPagination.total ||
                        0}{" "}
                      total records
                    </p>

                  </div>

                  {historyLoading && (
                    <Loader2
                      size={16}
                      className="animate-spin text-red-400"
                    />
                  )}

                </div>

                {historyLoading ? (

                  <div className="min-h-[230px] rounded-xl border border-white/[0.07] bg-white/[0.02] flex flex-col items-center justify-center">

                    <Loader2
                      size={26}
                      className="animate-spin text-red-500"
                    />

                    <p className="text-xs text-gray-500 mt-3">
                      Loading watch history...
                    </p>

                  </div>

                ) : watchHistory.length ===
                  0 ? (

                  <div className="min-h-[230px] rounded-xl border border-white/[0.07] bg-white/[0.02] flex flex-col items-center justify-center text-center px-5">

                    <PlayCircle
                      size={28}
                      className="text-gray-700"
                    />

                    <p className="text-sm text-gray-400 mt-3">
                      No watch history
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      This user has not watched anything yet.
                    </p>

                  </div>

                ) : (

                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

                    <div className="divide-y divide-white/[0.05]">

                      {watchHistory.map(
                        (item) => {

                          const content =
                            item?.content;

                          const isEpisode =
                            content?.type ===
                            "EPISODE";

                          const image =
                            content?.posterUrl ||
                            content?.thumbnailUrl ||
                            content?.backdropUrl ||
                            content
                              ?.series
                              ?.posterUrl ||
                            content
                              ?.series
                              ?.backdropUrl ||
                            "";

                          const title =
                            isEpisode
                              ? content
                                  ?.series
                                  ?.title ||
                                "Series"
                              : content?.title ||
                                "Movie";

                          const subtitle =
                            isEpisode
                              ? [
                                  `S${
                                    content
                                      ?.season
                                      ?.seasonNumber ||
                                    1
                                  }`,
                                  `E${
                                    content
                                      ?.episodeNumber ||
                                    1
                                  }`,
                                  content
                                    ?.title ||
                                    "",
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " • "
                                  )
                              : "Movie";

                          const progress =
                            Math.min(
                              Math.max(
                                Number(
                                  item
                                    ?.progressPercent
                                ) || 0,
                                0
                              ),
                              100
                            );

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="p-4 hover:bg-white/[0.015] transition"
                            >

                              <div className="flex gap-3">

                                {/* IMAGE */}

                                <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/[0.07] bg-black/20 shrink-0">

                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt={
                                        title
                                      }
                                      className="w-full h-full object-cover"
                                      onError={(
                                        e
                                      ) => {
                                        e.currentTarget.style.display =
                                          "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <PlayCircle
                                        size={
                                          18
                                        }
                                        className="text-gray-700"
                                      />
                                    </div>
                                  )}

                                </div>

                                {/* INFO */}

                                <div className="flex-1 min-w-0">

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0">

                                      <h4 className="text-sm font-semibold truncate">
                                        {title}
                                      </h4>

                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {subtitle}
                                      </p>

                                    </div>

                                    <span
                                      className={`shrink-0 px-2 py-1 rounded-md border text-[10px] font-semibold ${
                                        item.completed
                                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                          : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                      }`}
                                    >
                                      {item.completed
                                        ? "COMPLETED"
                                        : "IN PROGRESS"}
                                    </span>

                                  </div>

                                  {/* PROGRESS */}

                                  <div className="mt-3">

                                    <div className="flex items-center justify-between mb-1.5">

                                      <span className="text-[10px] text-gray-600">
                                        Progress
                                      </span>

                                      <span className="text-[10px] text-gray-400">
                                        {progress}%
                                      </span>

                                    </div>

                                    <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.06]">

                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          item.completed
                                            ? "bg-emerald-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{
                                          width:
                                            progress +
                                            "%",
                                        }}
                                      />

                                    </div>

                                  </div>

                                  {/* META */}

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">

                                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                                      <Clock3
                                        size={11}
                                      />

                                      {formatDuration(
                                        item.progressSeconds
                                      )}

                                      {item.duration
                                        ? ` / ${formatDuration(
                                            item.duration
                                          )}`
                                        : ""}
                                    </span>

                                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                                      <CalendarDays
                                        size={11}
                                      />

                                      {formatDate(
                                        item.lastWatchedAt
                                      )}
                                    </span>

                                  </div>

                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* HISTORY PAGINATION */}

                    {historyPagination.totalPages >
                      1 && (

                      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">

                        <button
                          type="button"
                          disabled={
                            !historyPagination.hasPreviousPage ||
                            historyLoading
                          }
                          onClick={() =>
                            fetchWatchHistory(
                              selectedUser.id,
                              historyPage -
                                1
                            )
                          }
                          className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-gray-300 flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        >

                          <ChevronLeft
                            size={14}
                          />

                          Prev

                        </button>

                        <span className="text-[10px] text-gray-600">

                          Page{" "}
                          {historyPage}{" "}
                          of{" "}
                          {historyPagination.totalPages}

                        </span>

                        <button
                          type="button"
                          disabled={
                            !historyPagination.hasNextPage ||
                            historyLoading
                          }
                          onClick={() =>
                            fetchWatchHistory(
                              selectedUser.id,
                              historyPage +
                                1
                            )
                          }
                          className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-xs text-gray-300 flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        >

                          Next

                          <ChevronRight
                            size={14}
                          />

                        </button>

                      </div>

                    )}

                  </div>

                )}

              </div>

              {/* =================================================
                  BLOCK / UNBLOCK
              ================================================= */}

              {selectedUser.role !==
                "ADMIN" && (
                <div className="mt-6 pt-5 border-t border-white/[0.06]">

                  <button
                    type="button"
                    onClick={() =>
                      toggleBlock(
                        selectedUser
                      )
                    }
                    disabled={
                      actionLoading ===
                      "block-" +
                        selectedUser.id
                    }
                    className={`w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      selectedUser.isBlocked
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                        : "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/15"
                    } disabled:opacity-50`}
                  >

                    {actionLoading ===
                    "block-" +
                      selectedUser.id ? (

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                    ) : selectedUser.isBlocked ? (

                      <ShieldOff
                        size={17}
                      />

                    ) : (

                      <Ban
                        size={17}
                      />

                    )}

                    {selectedUser.isBlocked
                      ? "Unblock User"
                      : "Block User"}

                  </button>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminUsers;

