import { lazy, Suspense, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useDispatch } from "react-redux";

import SiteBranding from "./components/SiteBranding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import MoviePlayer from "./pages/MoviePlayer";
import SeriesDetails from "./pages/SeriesDetails";
import Episode from "./pages/EpisodePlayer";
import SearchResults from "./pages/SearchResults";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import MaintenanceGuard from "./components/MaintenanceGuard";

import WatchHistory from "./pages/WatchHistory";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import MyList from "./pages/MyList";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";

// =========================
// ADMIN
// =========================

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import AdminMovies from "./admin/AdminMovies";
import AdminSeries from "./admin/AdminSeries";
import AdminSeasons from "./admin/AdminSeasons";
import AdminEpisodes from "./admin/AdminEpisodes";
import AdminGenres from "./admin/AdminGenres";
import AdminBanners from "./admin/AdminBanners";
import AdminUsers from "./admin/AdminUsers";
import AdminAnalytics from "./admin/AdminAnalytics";
import AdminNotifications from "./admin/AdminNotifications";
import AdminSettings from "./admin/AdminSettings";
import AdminHomeSections from "./admin/AdminHomeSections";

// =========================
// AUTH
// =========================

import { clearAuth } from "./features/auth/authSlice";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =========================================================
  // SESSION EXPIRED HANDLER
  // =========================================================

  useEffect(() => {
    const handleSessionExpired = () => {
      console.log(
        "🔒 Session expired. Clearing authentication..."
      );

      // Clear Redux auth state
      dispatch(clearAuth());

      // Redirect user to login
      navigate("/login", {
        replace: true,
      });
    };

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired
      );
    };
  }, [dispatch, navigate]);

  return (
    <>
      <SiteBranding />

      <Routes>
        {/* =========================
          PUBLIC
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
          PROTECTED USER ROUTES
        ========================= */}

        <Route element={<ProtectedRoute />}>
          {/* Maintenance check only for normal users */}

          <Route element={<MaintenanceGuard />}>
            <Route
              path="/home"
              element={<Home />}
            />

            <Route
              path="/search"
              element={<SearchResults />}
            />

            <Route
              path="/movies"
              element={<Movies />}
            />

            <Route
              path="/movie/:movieId"
              element={<MovieDetails />}
            />

            <Route
              path="/watch/movie/:movieId"
              element={<MoviePlayer />}
            />

            <Route
              path="/series"
              element={<Series />}
            />

            <Route
              path="/series/:seriesId"
              element={<SeriesDetails />}
            />

            <Route
              path="/series/:seriesId/episode/:episodeId"
              element={<Episode />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/history"
              element={<WatchHistory />}
            />

            <Route
              path="/my-list"
              element={<MyList />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="/subscription"
              element={<Subscription />}
            />
          </Route>
        </Route>

        {/* =========================
          ADMIN ROUTES
          Maintenance bypass
        ========================= */}

        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/movies"
              element={<AdminMovies />}
            />

            <Route
              path="/admin/series"
              element={<AdminSeries />}
            />

            <Route
              path="/admin/series/:seriesId/seasons"
              element={<AdminSeasons />}
            />

            <Route
              path="/admin/series/:seriesId/seasons/:seasonId/episodes"
              element={<AdminEpisodes />}
            />

            <Route
              path="/admin/genres"
              element={<AdminGenres />}
            />

            <Route
              path="/admin/banners"
              element={<AdminBanners />}
            />

            <Route
              path="/admin/users"
              element={<AdminUsers />}
            />

            <Route
              path="/admin/analytics"
              element={<AdminAnalytics />}
            />

            <Route
              path="/admin/notifications"
              element={<AdminNotifications />}
            />

            <Route
              path="/admin/settings"
              element={<AdminSettings />}
            />

            <Route
              path="/admin/home-sections"
              element={<AdminHomeSections />}
            />
          </Route>
        </Route>

        {/* =========================
          DEFAULT
        ========================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />

        {/* =========================
          UNKNOWN
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/home"
              replace
            />
          }
        />
      </Routes>
    </>
  );
};

export default App;