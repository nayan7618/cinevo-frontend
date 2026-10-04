import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api"

import {
  Film,
  Tv,
  Users,
  Eye,
  Bell,
  TrendingUp,
  RefreshCw,
  Loader2,
  UserRound,
  Ban,
  Image,
  Clock3,
  ChevronRight,
} from "lucide-react";

// =====================================================
// HELPERS
// =====================================================

const formatNumber = (value) => {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M";
  }

  if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  }

  return number.toLocaleString();
};

const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "—";
  }
};

const formatDay = (date) => {
  try {
    return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
    });
  } catch {
    return "";
  }
};

// =====================================================
// MAIN
// =====================================================

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalSeries: 0,
    totalUsers: 0,
    totalViews: 0,
    blockedUsers: 0,
    activeBanners: 0,
    uniqueViewers: 0,
    totalWatchSeconds: 0,
    totalWatchHours: 0,
  });

  const [dailyViews, setDailyViews] = useState([]);

  const [topMovies, setTopMovies] = useState([]);

  const [recentUsers, setRecentUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/admin/dashboard");

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to load dashboard");
      }

      const data = response.data;

      setStats(data?.stats || {});

      setDailyViews(Array.isArray(data?.dailyViews) ? data.dailyViews : []);

      setTopMovies(Array.isArray(data?.topMovies) ? data.topMovies : []);

      setRecentUsers(Array.isArray(data?.recentUsers) ? data.recentUsers : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // =====================================================
  // CHART MAX
  // =====================================================

  const maxViews = useMemo(() => {
    const values = dailyViews.map((item) => Number(item.views) || 0);

    return Math.max(...values, 1);
  }, [dailyViews]);

  return (
    <div className="min-h-[calc(100dvh-2rem)] bg-[#08080c] text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <TrendingUp size={21} className="text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Cinevo platform overview
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <div className="flex min-h-[500px] flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/10">
            <Loader2 size={27} className="animate-spin text-red-500" />
          </div>

          <p className="mt-4 text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* MOVIES */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total Movies</p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatNumber(stats.totalMovies)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
                  <Film size={20} className="text-red-400" />
                </div>
              </div>
            </div>

            {/* SERIES */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total Series</p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatNumber(stats.totalSeries)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                  <Tv size={20} className="text-blue-400" />
                </div>
              </div>
            </div>

            {/* USERS */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total Users</p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatNumber(stats.totalUsers)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10">
                  <Users size={20} className="text-purple-400" />
                </div>
              </div>
            </div>

            {/* VIEWS */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total Views</p>

                  <p className="mt-2 text-3xl font-bold">
                    {formatNumber(stats.totalViews)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Eye size={20} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              SECONDARY STATS
          ================================================= */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Clock3 size={18} className="text-yellow-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Watch Time
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {stats.totalWatchHours || 0}h
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Users size={18} className="text-cyan-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Unique Viewers
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {formatNumber(stats.uniqueViewers)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Ban size={18} className="text-red-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Blocked Users
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {formatNumber(stats.blockedUsers)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#101010] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <Image size={18} className="text-orange-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Active Banners
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {formatNumber(stats.activeBanners)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              CHART + TOP MOVIES
          ================================================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* 7 DAY CHART */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Views — Last 7 Days</h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Daily platform view activity
                  </p>
                </div>

                <TrendingUp size={18} className="text-red-400" />
              </div>

              <div className="mt-7 h-64">
                <div className="flex h-full items-end gap-2 sm:gap-3">
                  {dailyViews.map((day) => {
                    const views = Number(day.views) || 0;

                    const height = Math.max(
                      (views / maxViews) * 100,
                      views > 0 ? 5 : 2,
                    );

                    return (
                      <div
                        key={day.date}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-[10px] text-zinc-500">
                          {formatNumber(views)}
                        </span>

                        <div className="flex h-[85%] w-full items-end justify-center">
                          <div
                            className="w-full max-w-12 rounded-t-lg bg-red-500/80 transition-all duration-500 hover:bg-red-400"
                            style={{
                              height: height + "%",
                            }}
                            title={views + " views"}
                          />
                        </div>

                        <span className="text-[10px] text-zinc-600">
                          {formatDay(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TOP MOVIES */}

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Top Movies</h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Most viewed movies
                  </p>
                </div>

                <Film size={18} className="text-red-400" />
              </div>

              <div className="mt-5 space-y-3">
                {topMovies.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-zinc-600">
                    No movie views yet
                  </div>
                ) : (
                  topMovies.map((movie, index) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/20 p-3"
                    >
                      <span className="w-5 text-center text-xs font-bold text-zinc-600">
                        {index + 1}
                      </span>

                      <div className="h-12 w-9 overflow-hidden rounded-md bg-white/[0.04]">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Film size={14} className="text-zinc-600" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {movie.title}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatNumber(movie.views)} views
                        </p>
                      </div>

                      <ChevronRight size={15} className="text-zinc-700" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              RECENT USERS
          ================================================= */}

          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-semibold">Recent Users</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Latest registered accounts
                </p>
              </div>

              <Users size={18} className="text-blue-400" />
            </div>

            {recentUsers.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-zinc-600">
                No users yet
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.015] sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
                      <UserRound size={17} className="text-zinc-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {user.name || "Unknown User"}
                        </p>

                        {user.role === "ADMIN" && (
                          <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-semibold text-purple-400">
                            ADMIN
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {user.email}
                      </p>
                    </div>

                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-zinc-400">
                        {user.subscription?.plan || "NONE"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-zinc-600">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>

                    {user.isBlocked && (
                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-semibold text-red-400">
                        BLOCKED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              QUICK STATUS
          ================================================= */}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Eye size={18} className="text-blue-400" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Unique Viewers</h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Users who generated at least one view
                  </p>
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold">
                {formatNumber(stats.uniqueViewers)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Bell size={18} className="text-red-400" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Admin Actions</h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Use the sidebar to manage platform data
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-zinc-400">
                Movies, Series, Users, Banners, Notifications and Analytics are
                available from the Admin Panel.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
