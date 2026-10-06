import { useEffect, useRef, useState } from "react";

import {
  Search,
  Bell,
  Crown,
  ChevronDown,
  X,
  Loader2,
  Film,
  Tv,
  User,
  List,
  History,
  Settings,
  LogOut,
  Check,
  CheckCheck,
  Info,
  AlertCircle,
  Gift,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../services/api";

import { logoutUser } from "../features/auth/authSlice";

// =====================================================
// TOPBAR
// =====================================================

const Topbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleSidebarState = (event) => {
      const isOpen = Boolean(event.detail?.open);

      setMobileSidebarOpen(isOpen);

      if (isOpen) {
        setShowDropdown(false);
        searchRef.current?.querySelector("input")?.blur();
      }
    };

    window.addEventListener("cinebox:sidebar-state", handleSidebarState);

    return () => {
      window.removeEventListener("cinebox:sidebar-state", handleSidebarState);
    };
  }, []);

  // =====================================================
  // AUTH
  // =====================================================

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] = useState("");

  const [results, setResults] = useState({
    movies: [],
    series: [],
  });

  const [searchLoading, setSearchLoading] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  // =====================================================
  // PROFILE
  // =====================================================

  const [showProfile, setShowProfile] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);

  const [notificationLoading, setNotificationLoading] = useState(false);

  const [notificationActionLoading, setNotificationActionLoading] =
    useState(false);

  // =====================================================
  // USER DATA
  // =====================================================

  const userName = user?.name || "User";

  const userInitial = userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const userPlan = user?.subscription?.plan || "FREE";

  const planLabel = userPlan === "FREE" ? "Free Plan" : `${userPlan} Plan`;

  // =====================================================
  // LIVE SEARCH
  // =====================================================

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setResults({
        movies: [],
        series: [],
      });

      setSearchLoading(false);
      setShowDropdown(false);

      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const response = await api.get("/search", {
          params: {
            q: query,
            page: 1,
            limit: 6,
          },
        });

        const searchResults = response.data?.results || {};

        setResults({
          movies: Array.isArray(searchResults.movies)
            ? searchResults.movies
            : [],

          series: Array.isArray(searchResults.series)
            ? searchResults.series
            : [],
        });
      } catch (error) {
        console.error("Live search error:", error);

        setResults({
          movies: [],
          series: [],
        });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = async (showLoader = false) => {
    try {
      if (showLoader) {
        setNotificationLoading(true);
      }

      const response = await api.get("/notifications");

      if (response.data?.success) {
        setNotifications(
          Array.isArray(response.data.notifications)
            ? response.data.notifications
            : [],
        );

        setUnreadCount(Number(response.data.unreadCount || 0));
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      if (showLoader) {
        setNotificationLoading(false);
      }
    }
  };

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // =====================================================
  // CLICK OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // FULL SEARCH
  // =====================================================

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = search.trim();

    if (!query) return;

    setShowDropdown(false);

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const clearSearch = () => {
    setSearch("");

    setResults({
      movies: [],
      series: [],
    });

    setShowDropdown(false);
  };

  // =====================================================
  // OPEN MOVIE
  // =====================================================

  const openMovie = (movie) => {
    if (!movie?.id) return;

    setShowDropdown(false);

    navigate(`/movie/${movie.id}`);
  };

  // =====================================================
  // OPEN SERIES
  // =====================================================

  const openSeries = (series) => {
    if (!series?.id) return;

    setShowDropdown(false);

    navigate(`/series/${series.id}`);
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const toggleProfile = () => {
    setShowNotifications(false);

    setShowProfile((value) => !value);
  };

  const openProfile = () => {
    setShowProfile(false);
    navigate("/profile");
  };

  const openHistory = () => {
    setShowProfile(false);
    navigate("/history");
  };

  const openMyList = () => {
    setShowProfile(false);
    navigate("/my-list");
  };

  const openSettings = () => {
    setShowProfile(false);
    navigate("/settings");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    if (logoutLoading) return;

    try {
      setLogoutLoading(true);

      await dispatch(logoutUser()).unwrap();

      setShowProfile(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  // =====================================================
  // PREMIUM
  // =====================================================

  const handlePremium = () => {
    navigate("/subscription");
  };

  // =====================================================
  // NOTIFICATION TOGGLE
  // =====================================================

  const handleNotifications = async () => {
    setShowProfile(false);

    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState) {
      await fetchNotifications(true);
    }
  };

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markNotificationAsRead = async (notification) => {
    if (!notification?.id) return;

    if (notification.isRead) {
      return;
    }

    try {
      setNotificationActionLoading(true);

      const response = await api.patch(
        `/notifications/${notification.id}/read`,
        {},
      );

      if (response.data?.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error("Mark notification read error:", error);
    } finally {
      setNotificationActionLoading(false);
    }
  };

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllNotificationsAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setNotificationActionLoading(true);

      const response = await api.patch(`/notifications/read-all`, {});

      if (response.data?.success) {
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            isRead: true,
          })),
        );

        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Mark all notifications error:", error);
    } finally {
      setNotificationActionLoading(false);
    }
  };

  // =====================================================
  // NOTIFICATION DATE
  // =====================================================

  const formatNotificationDate = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) {
      return "";
    }

    const now = new Date();

    const diff = now.getTime() - notificationDate.getTime();

    const minutes = Math.floor(diff / 60000);

    const hours = Math.floor(diff / 3600000);

    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    if (hours < 24) {
      return `${hours}h ago`;
    }

    if (days < 7) {
      return `${days}d ago`;
    }

    return notificationDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // NOTIFICATION ICON
  // =====================================================

  const getNotificationIcon = (type) => {
    switch (String(type).toUpperCase()) {
      case "SUCCESS":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <Check size={17} className="text-green-400" />
          </div>
        );

      case "WARNING":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
            <AlertCircle size={17} className="text-yellow-400" />
          </div>
        );

      case "PROMOTION":
      case "OFFER":
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <Gift size={17} className="text-red-400" />
          </div>
        );

      case "INFO":
      default:
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Info size={17} className="text-blue-400" />
          </div>
        );
    }
  };

  const totalResults = results.movies.length + results.series.length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#08080c]/90 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="grid grid-cols-[1fr_auto] gap-3 min-[600px]:flex min-[600px]:items-center min-[600px]:justify-between">
        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          ref={searchRef}
          className={`relative col-span-2 min-w-0 w-full sm:col-span-1 sm:flex-1 ${
            mobileSidebarOpen ? "hidden lg:block" : "block"
          } min-[600px]:ml-[10rem] lg:ml-0`}
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-600 sm:left-4"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                const value = e.target.value;

                setSearch(value);

                setShowDropdown(Boolean(value.trim()));
              }}
              onFocus={() => {
                if (search.trim()) {
                  setShowDropdown(true);
                }
              }}
              placeholder="Search movies, series..."
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-10 pr-10 text-sm text-white outline-none transition duration-200 placeholder:text-zinc-500 focus:border-red-500/50 focus:bg-white/[0.07] sm:h-12 sm:pl-12 sm:pr-20 sm:text-[15px]"
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {searchLoading && (
                <Loader2
                  size={17}
                  className="mr-1 animate-spin text-zinc-500"
                />
              )}

              {search && !searchLoading && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* =================================================
              LIVE SEARCH
          ================================================= */}

          {showDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[60] overflow-hidden rounded-2xl border border-white/10 bg-[#111116]/98 shadow-2xl backdrop-blur-xl">
              {searchLoading && (
                <div className="flex items-center gap-3 px-5 py-6 text-sm text-zinc-500">
                  <Loader2 size={18} className="animate-spin" />
                  Searching...
                </div>
              )}

              {!searchLoading && totalResults > 0 && (
                <div className="max-h-[430px] overflow-y-auto p-2">
                  {/* MOVIES */}

                  {results.movies.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Film size={15} className="text-red-500" />

                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Movies
                        </span>
                      </div>

                      {results.movies.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => openMovie(movie)}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"
                        >
                          <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                            <img
                              src={
                                movie.posterUrl ||
                                movie.backdropUrl ||
                                "/images/placeholder.jpg"
                              }
                              alt={movie.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.jpg";
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {movie.title}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                              <span>Movie</span>

                              {movie.releaseYear && (
                                <>
                                  <span>•</span>

                                  <span>{movie.releaseYear}</span>
                                </>
                              )}

                              {movie.language && (
                                <>
                                  <span>•</span>

                                  <span>{movie.language}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SERIES */}

                  {results.series.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Tv size={15} className="text-red-500" />

                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Series
                        </span>
                      </div>

                      {results.series.map((series) => (
                        <button
                          key={series.id}
                          type="button"
                          onClick={() => openSeries(series)}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"
                        >
                          <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                            <img
                              src={
                                series.posterUrl ||
                                series.backdropUrl ||
                                "/images/placeholder.jpg"
                              }
                              alt={series.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/placeholder.jpg";
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {series.title}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                              <span>Series</span>

                              {series.releaseYear && (
                                <>
                                  <span>•</span>

                                  <span>{series.releaseYear}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* VIEW ALL */}

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="mt-2 w-full border-t border-white/5 px-3 py-3 text-center text-xs font-medium text-zinc-400 transition hover:text-white"
                  >
                    View all results for "{search}"
                  </button>
                </div>
              )}

              {/* NO RESULTS */}

              {!searchLoading && search.trim() && totalResults === 0 && (
                <div className="px-5 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-600">
                    <Search size={21} />
                  </div>

                  <p className="text-sm font-medium text-white">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    Try another movie or series name.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================
            RIGHT SECTION
        ================================================= */}

        <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2 sm:col-auto sm:row-auto sm:gap-3">
          {/* PREMIUM */}

          <button
            type="button"
            onClick={handlePremium}
            className="hidden items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 sm:flex"
          >
            <Crown size={17} />
            Premium
          </button>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={handleNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN */}

            {showNotifications && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[350px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-white/10 bg-[#111116]/98 shadow-2xl backdrop-blur-xl">
                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      {unreadCount > 0
                        ? `${unreadCount} unread notification${
                            unreadCount > 1 ? "s" : ""
                          }`
                        : "You're all caught up"}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={notificationActionLoading}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      {notificationActionLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={14} />
                      )}
                      Mark all read
                    </button>
                  )}
                </div>

                {/* LOADING */}

                {notificationLoading ? (
                  <div className="flex flex-col items-center justify-center px-5 py-10">
                    <Loader2 size={23} className="animate-spin text-red-500" />

                    <p className="mt-3 text-xs text-zinc-500">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  /* EMPTY */

                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-600">
                      <Bell size={21} />
                    </div>

                    <p className="mt-4 text-sm font-medium text-white">
                      No notifications
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      You're all caught up.
                    </p>
                  </div>
                ) : (
                  /* LIST */

                  <div className="max-h-[430px] overflow-y-auto p-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationAsRead(notification)}
                        className={`flex w-full gap-3 rounded-xl p-3 text-left transition ${
                          notification.isRead
                            ? "bg-transparent hover:bg-white/[0.04]"
                            : "bg-white/[0.04] hover:bg-white/[0.07]"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p
                              className={`line-clamp-1 text-sm ${
                                notification.isRead
                                  ? "font-medium text-zinc-300"
                                  : "font-semibold text-white"
                              }`}
                            >
                              {notification.title}
                            </p>

                            {!notification.isRead && (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-[10px] text-zinc-600">
                            {formatNotificationDate(notification.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* FOOTER */}

                {notifications.length > 0 && (
                  <div className="border-t border-white/5 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-xs font-medium text-zinc-500 transition hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =================================================
              PROFILE
          ================================================= */}

          {isAuthenticated && (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={toggleProfile}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5 transition hover:bg-white/[0.08]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                  {userInitial}
                </div>

                <div className="hidden max-w-[130px] text-left md:block">
                  <p className="truncate text-xs font-semibold text-white">
                    {userName}
                  </p>

                  <p className="text-[10px] text-zinc-500">{planLabel}</p>
                </div>

                <ChevronDown
                  size={15}
                  className={`hidden text-zinc-500 transition md:block ${
                    showProfile ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* PROFILE MENU */}

              {showProfile && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#111116] shadow-2xl">
                  {/* USER HEADER */}

                  <div className="border-b border-white/5 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white">
                        {userInitial}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {userName}
                        </p>

                        <p className="truncate text-xs text-zinc-500">
                          {user?.email || "CINEBOX User"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MENU */}

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={openProfile}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <User size={17} />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={openMyList}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <List size={17} />
                      My List
                    </button>

                    <button
                      type="button"
                      onClick={openHistory}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <History size={17} />
                      Watch History
                    </button>

                    <button
                      type="button"
                      onClick={openSettings}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Settings size={17} />
                      Settings
                    </button>

                    <div className="my-2 h-px bg-white/5" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {logoutLoading ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <LogOut size={17} />
                      )}

                      {logoutLoading ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
