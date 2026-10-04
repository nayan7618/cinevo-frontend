import { useEffect, useState } from "react";
import api from "../services/api";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import ContinueWatchingCard from "../components/ContinueWatchingCard";
import HilltopBanner from "@/components/ads/HilltopBanner";

const Home = () => {
  // =========================================================
  // CONTINUE WATCHING
  // =========================================================

  const [watchHistory, setWatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // =========================================================
  // RECOMMENDATIONS
  // =========================================================

  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendedSeries, setRecommendedSeries] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(true);

  // =========================================================
  // BECAUSE YOU WATCHED
  // =========================================================

  const [becauseWatchedMovies, setBecauseWatchedMovies] = useState([]);

  const [becauseWatchedSeries, setBecauseWatchedSeries] = useState([]);

  const [becauseWatchedTitle, setBecauseWatchedTitle] = useState("");

  const [becauseWatchedLoading, setBecauseWatchedLoading] = useState(true);

  // =========================================================
  // DYNAMIC HOME SECTIONS
  // =========================================================

  const [homeSections, setHomeSections] = useState([]);
  const [homeSectionsLoading, setHomeSectionsLoading] = useState(true);

  // =========================================================
  // SITE AD SETTINGS
  // =========================================================

 const [siteAdSettingsLoading, setSiteAdSettingsLoading] = useState(true);

const [siteAdSettings, setSiteAdSettings] = useState({
  adsEnabled: false,
  bannerAdsEnabled: false,
});

  // =========================================================
  // SITE SETTINGS / ADS
  // =========================================================

useEffect(() => {
  const fetchSiteSettings = async () => {
    try {
      const response = await api.get("/settings/public").catch(() => ({
        data: {
          success: false,
          settings: {},
        },
      }));

      const publicSettings = response.data?.settings || {};

      setSiteAdSettings({
        adsEnabled: publicSettings.adsEnabled !== false,
        bannerAdsEnabled: publicSettings.bannerAdsEnabled !== false,
      });
    } catch {
      setSiteAdSettings({
        adsEnabled: true,
        bannerAdsEnabled: true,
      });
    } finally {
      setSiteAdSettingsLoading(false);
    }
  };

  fetchSiteSettings();
}, []);

  // =========================================================
  // WATCH HISTORY
  // =========================================================

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        setHistoryLoading(true);

        const response = await api.get("/watch-history");

        const history = response.data?.continueWatching || [];

        // ==========================================
        // SAME SERIES KE MULTIPLE EPISODES KO GROUP KARO
        // ==========================================

        const grouped = new Map();

        for (const item of history) {
          if (!item || item.completed) continue;

          // =========================
          // MOVIE
          // =========================

          if (item.type === "MOVIE") {
            grouped.set(`movie-${item.content.id}`, item);

            continue;
          }

          // =========================
          // EPISODE
          // =========================

          if (item.type === "EPISODE") {
            const seriesId = item.content?.series?.id;

            // Series information missing
            // hole episode individually rakho
            if (!seriesId) {
              grouped.set(`episode-${item.content.id}`, item);

              continue;
            }

            const key = `series-${seriesId}`;

            const existing = grouped.get(key);

            // Latest watched episode keep karo
            if (
              !existing ||
              new Date(item.lastWatchedAt) > new Date(existing.lastWatchedAt)
            ) {
              grouped.set(key, item);
            }
          }
        }

        const result = Array.from(grouped.values());

        // Latest watched first
        result.sort(
          (a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt),
        );

        setWatchHistory(result);
      } catch {
        setWatchHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchWatchHistory();
  }, []);

  // =========================================================
  // RECOMMENDATIONS
  // =========================================================

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommendationLoading(true);

        const response = await api.get("/recommendations/for-you", {
          params: {
            limit: 10,
          },
        });

        if (response.data?.success) {
          setRecommendedMovies(
            (response.data?.movies || [])
              .map((item) => item?.movie)
              .filter(Boolean),
          );

          setRecommendedSeries(
            (response.data?.series || [])
              .map((item) => item?.series)
              .filter(Boolean),
          );
        } else {
          setRecommendedMovies([]);
          setRecommendedSeries([]);
        }
      } catch {
        setRecommendedMovies([]);
        setRecommendedSeries([]);
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  // =========================================================
  // BECAUSE YOU WATCHED
  // =========================================================

  useEffect(() => {
    const fetchBecauseYouWatched = async () => {
      try {
        setBecauseWatchedLoading(true);

        const response = await api.get("/recommendations/because-watched", {
          params: {
            limit: 10,
          },
        });

        if (response.data?.success) {
          setBecauseWatchedTitle(response.data?.sourceTitle || "");

          setBecauseWatchedMovies(
            (response.data?.movies || [])
              .map((item) => item?.movie)
              .filter(Boolean),
          );

          setBecauseWatchedSeries(
            (response.data?.series || [])
              .map((item) => item?.series)
              .filter(Boolean),
          );
        } else {
          setBecauseWatchedMovies([]);
          setBecauseWatchedSeries([]);
          setBecauseWatchedTitle("");
        }
      } catch {
        setBecauseWatchedMovies([]);
        setBecauseWatchedSeries([]);
        setBecauseWatchedTitle("");
      } finally {
        setBecauseWatchedLoading(false);
      }
    };

    fetchBecauseYouWatched();
  }, []);

  // =========================================================
  // DYNAMIC HOME SECTIONS
  // =========================================================

  useEffect(() => {
    const fetchHomeSections = async () => {
      try {
        setHomeSectionsLoading(true);

        const response = await api.get("/home/sections");

        if (response.data?.success) {
          setHomeSections(
            Array.isArray(response.data.sections) ? response.data.sections : [],
          );
        } else {
          setHomeSections([]);
        }
      } catch {
        setHomeSections([]);
      } finally {
        setHomeSectionsLoading(false);
      }
    };

    fetchHomeSections();
  }, []);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <Sidebar />

      <main className="lg:ml-64">
        <Topbar />

        {/* =========================
            HERO
        ========================= */}

        <HeroBanner />

        {/* =========================
            BANNER AD
        ========================= */}

        {!siteAdSettingsLoading &&
          siteAdSettings.adsEnabled &&
          siteAdSettings.bannerAdsEnabled && <HilltopBanner />}

        {/* =========================
            CONTINUE WATCHING
        ========================= */}

        <section className="px-6 pb-8 pt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
              Continue Watching
            </h2>

            <p className="mt-1 text-xs text-zinc-500 md:text-sm">
              Pick up where you left off
            </p>
          </div>

          {historyLoading ? (
            <div className="flex gap-5 overflow-x-auto pb-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[190px] w-[280px] shrink-0 animate-pulse rounded-2xl bg-zinc-900"
                />
              ))}
            </div>
          ) : watchHistory.length > 0 ? (
            <div className="cinevo-scrollbar flex gap-5 overflow-x-auto pb-4">
              {watchHistory.map((item) => (
                <ContinueWatchingCard key={item.id} history={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center">
              <p className="text-sm text-zinc-500">
                Start watching something to see it here.
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            BECAUSE YOU WATCHED
        ================================================= */}

        {!becauseWatchedLoading &&
          becauseWatchedTitle &&
          becauseWatchedMovies.length > 0 && (
            <MovieRow
              title={`Because You Watched "${becauseWatchedTitle}"`}
              subtitle="More movies you may enjoy"
              movies={becauseWatchedMovies}
              type="Movie"
            />
          )}

        {!becauseWatchedLoading &&
          becauseWatchedTitle &&
          becauseWatchedSeries.length > 0 && (
            <MovieRow
              title={`Because You Watched "${becauseWatchedTitle}"`}
              subtitle="More series you may enjoy"
              movies={becauseWatchedSeries}
              type="Series"
            />
          )}

        {/* =================================================
            RECOMMENDED FOR YOU
        ================================================= */}

        {!recommendationLoading && recommendedMovies.length > 0 && (
          <MovieRow
            title="Recommended for You"
            subtitle="Picked based on what you watch"
            movies={recommendedMovies}
            type="Movie"
          />
        )}

        {/* =================================================
            DYNAMIC HOME SECTIONS
        ================================================= */}

        {!homeSectionsLoading &&
          homeSections.map((section) => {
            const contentType = String(
              section?.contentType || "",
            ).toUpperCase();

            return (
              <div key={section.id}>
                {/* MOVIES */}

                {(contentType === "MOVIES" || contentType === "BOTH") &&
                  Array.isArray(section?.movies) &&
                  section.movies.length > 0 && (
                    <MovieRow
                      title={section.title}
                      subtitle={section.subtitle || ""}
                      movies={section.movies}
                      type="Movie"
                    />
                  )}

                {/* SERIES */}

                {(contentType === "SERIES" || contentType === "BOTH") &&
                  Array.isArray(section?.series) &&
                  section.series.length > 0 && (
                    <MovieRow
                      title={section.title}
                      subtitle={section.subtitle || ""}
                      movies={section.series}
                      type="Series"
                    />
                  )}
              </div>
            );
          })}

        {/* =================================================
            EMPTY HOME SECTIONS
        ================================================= */}

        {!homeSectionsLoading && homeSections.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">No home sections available.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
