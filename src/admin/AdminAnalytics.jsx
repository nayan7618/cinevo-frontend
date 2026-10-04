import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api"

import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock3,
  Film,
  Play,
  RefreshCw,
  TrendingUp,
  Tv,
  Users,
  Eye,
  AlertCircle,
} from "lucide-react";

// =====================================================
// HELPERS
// =====================================================

const formatNumber = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN").format(number);
};

const formatWatchTime = (seconds) => {
  const totalSeconds = Math.max(
    0,
    Number(seconds) || 0
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatFullDate = (dateValue) => {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// SIMPLE LINE CHART
// =====================================================

const ViewsChart = ({ data }) => {
  const chartData = Array.isArray(data)
    ? data
    : [];

  const width = 900;
  const height = 300;

  const paddingLeft = 48;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 44;

  const innerWidth =
    width -
    paddingLeft -
    paddingRight;

  const innerHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxViews = Math.max(
    1,
    ...chartData.map(
      (item) => Number(item?.views) || 0
    )
  );

  const points = chartData.map(
    (item, index) => {
      const x =
        chartData.length === 1
          ? paddingLeft +
            innerWidth / 2
          : paddingLeft +
            (index /
              (chartData.length - 1)) *
              innerWidth;

      const views =
        Number(item?.views) || 0;

      const y =
        paddingTop +
        innerHeight -
        (views / maxViews) *
          innerHeight;

      return {
        x,
        y,
        views,
        date: item?.date,
      };
    }
  );

  const linePath =
    points.length > 0
      ? points
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${
                point.x
              } ${point.y}`
          )
          .join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${linePath}
         L ${points[points.length - 1].x} ${
          paddingTop + innerHeight
        }
         L ${points[0].x} ${
          paddingTop + innerHeight
        }
         Z`
      : "";

  const gridValues = [0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[300px] w-full"
        preserveAspectRatio="none"
      >
        {/* GRID */}
        {gridValues.map(
          (ratio, index) => {
            const y =
              paddingTop +
              innerHeight -
              ratio * innerHeight;

            const value = Math.round(
              maxViews * ratio
            );

            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  x2={
                    width - paddingRight
                  }
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-white/[0.06]"
                  strokeWidth="1"
                />

                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-600 text-[10px]"
                >
                  {formatNumber(value)}
                </text>
              </g>
            );
          }
        )}

        {/* AXIS */}
        <line
          x1={paddingLeft}
          x2={
            width - paddingRight
          }
          y1={
            paddingTop +
            innerHeight
          }
          y2={
            paddingTop +
            innerHeight
          }
          stroke="currentColor"
          className="text-white/[0.08]"
        />

        {/* AREA */}
        {areaPath && (
          <path
            d={areaPath}
            fill="currentColor"
            className="text-red-500/10"
          />
        )}

        {/* LINE */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            className="text-red-500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* POINTS */}
        {points.map(
          (point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="currentColor"
                className="text-red-500"
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="transparent"
                stroke="currentColor"
                className="text-red-500/20"
              />
            </g>
          )
        )}

        {/* X LABELS */}
        {points.map(
          (point, index) => {
            const shouldShow =
              chartData.length <= 10 ||
              index === 0 ||
              index ===
                Math.floor(
                  chartData.length / 2
                ) ||
              index ===
                chartData.length - 1;

            if (!shouldShow) {
              return null;
            }

            return (
              <text
                key={index}
                x={point.x}
                y={height - 16}
                textAnchor="middle"
                className="fill-zinc-600 text-[10px]"
              >
                {formatDate(
                  point.date
                )}
              </text>
            );
          }
        )}
      </svg>
    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1.5 text-xs text-zinc-600">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
          <Icon
            size={20}
            className="text-red-500"
          />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  title,
  text,
}) => {
  return (
    <div className="flex min-h-[180px] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
          <BarChart3
            size={20}
            className="text-zinc-600"
          />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-zinc-300">
          {title}
        </h3>

        <p className="mt-1 text-xs text-zinc-600">
          {text}
        </p>
      </div>
    </div>
  );
};

// =====================================================
// CONTENT TABLE
// =====================================================

const ContentTable = ({
  title,
  icon: Icon,
  items,
  type,
}) => {
  const list = Array.isArray(items)
    ? items
    : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
            <Icon
              size={17}
              className="text-red-500"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              {title}
            </h2>

            <p className="mt-0.5 text-[11px] text-zinc-600">
              {type === "movie"
                ? "Most watched movies"
                : "Most watched series"}
            </p>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No data yet"
          text="View data will appear here."
        />
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {list.map(
            (item, index) => (
              <div
                key={
                  item.movieId ||
                  item.seriesId ||
                  index
                }
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
              >
                <div className="w-7 shrink-0 text-center text-xs font-semibold text-zinc-600">
                  {String(
                    index + 1
                  ).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {item.title ||
                      "Untitled"}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-600">
                    {formatWatchTime(
                      item.watchTimeSeconds ||
                        item.watchTime?.seconds ||
                        0
                    )}{" "}
                    watch time
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-white/[0.035] px-3 py-2">
                  <Eye
                    size={14}
                    className="text-zinc-500"
                  />

                  <span className="text-xs font-semibold text-zinc-300">
                    {formatNumber(
                      item.views
                    )}
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminAnalytics = () => {
  // ===================================================
  // STATE
  // ===================================================

  const [overview, setOverview] =
    useState(null);

  const [dailyData, setDailyData] =
    useState([]);

  const [topMovies, setTopMovies] =
    useState([]);

  const [topSeries, setTopSeries] =
    useState([]);

  const [movieAnalytics, setMovieAnalytics] =
    useState([]);

  const [seriesAnalytics, setSeriesAnalytics] =
    useState([]);

  const [days, setDays] =
    useState(7);

  const [activeTab, setActiveTab] =
    useState("movies");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ===================================================
  // FETCH ANALYTICS
  // ===================================================

  const fetchAnalytics =
    useCallback(
      async (showRefresh = false) => {
        try {
          setError("");

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const [
            overviewResponse,
            dailyResponse,
            topResponse,
            moviesResponse,
            seriesResponse,
          ] = await Promise.all([
            api.get(
              `/analytics/overview`,
            ),

            api.get(
              `/analytics/daily`,
              {
                params: {
                  days,
                },
              }
            ),

            api.get(
              `/analytics/top-content`,
              {
                params: {
                  limit: 10,
                },
              }
            ),

            api.get(
              `/analytics/movies`,
            ),

            api.get(
              `/analytics/series`,
            ),
          ]);

          // -------------------------------------------
          // Overview
          // -------------------------------------------

          const overviewData =
            overviewResponse.data;

          if (
            !overviewData?.success
          ) {
            throw new Error(
              overviewData?.message ||
                "Failed to fetch overview"
            );
          }

          setOverview(
            overviewData.analytics ||
              null
          );

          // -------------------------------------------
          // Daily
          // -------------------------------------------

          const dailyResponseData =
            dailyResponse.data;

          if (
            !dailyResponseData?.success
          ) {
            throw new Error(
              dailyResponseData?.message ||
                "Failed to fetch daily analytics"
            );
          }

          setDailyData(
            Array.isArray(
              dailyResponseData.analytics
            )
              ? dailyResponseData.analytics
              : []
          );

          // -------------------------------------------
          // Top Content
          // -------------------------------------------

          const topResponseData =
            topResponse.data;

          if (
            !topResponseData?.success
          ) {
            throw new Error(
              topResponseData?.message ||
                "Failed to fetch top content"
            );
          }

          setTopMovies(
            Array.isArray(
              topResponseData.topMovies
            )
              ? topResponseData.topMovies
              : []
          );

          setTopSeries(
            Array.isArray(
              topResponseData.topSeries
            )
              ? topResponseData.topSeries
              : []
          );

          // -------------------------------------------
          // Movies
          // -------------------------------------------

          const movieResponseData =
            moviesResponse.data;

          if (
            !movieResponseData?.success
          ) {
            throw new Error(
              movieResponseData?.message ||
                "Failed to fetch movie analytics"
            );
          }

          setMovieAnalytics(
            Array.isArray(
              movieResponseData.movies
            )
              ? movieResponseData.movies
              : []
          );

          // -------------------------------------------
          // Series
          // -------------------------------------------

          const seriesResponseData =
            seriesResponse.data;

          if (
            !seriesResponseData?.success
          ) {
            throw new Error(
              seriesResponseData?.message ||
                "Failed to fetch series analytics"
            );
          }

          setSeriesAnalytics(
            Array.isArray(
              seriesResponseData.series
            )
              ? seriesResponseData.series
              : []
          );

          console.log(
            "✅ Analytics loaded",
            {
              overview:
                overviewData.analytics,
              daily:
                dailyResponseData.analytics,
              topMovies:
                topResponseData.topMovies,
              topSeries:
                topResponseData.topSeries,
            }
          );
        } catch (err) {
          console.error(
            "❌ Admin analytics error:",
            err.response?.data ||
              err
          );

          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load analytics"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [days]
    );

  // ===================================================
  // INITIAL LOAD + RANGE CHANGE
  // ===================================================

  useEffect(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  // ===================================================
  // DERIVED DATA
  // ===================================================

  const maxMovieViews =
    useMemo(() => {
      if (
        movieAnalytics.length === 0
      ) {
        return 1;
      }

      return Math.max(
        1,
        ...movieAnalytics.map(
          (item) =>
            Number(item.views) || 0
        )
      );
    }, [movieAnalytics]);

  const maxSeriesViews =
    useMemo(() => {
      if (
        seriesAnalytics.length === 0
      ) {
        return 1;
      }

      return Math.max(
        1,
        ...seriesAnalytics.map(
          (item) =>
            Number(item.views) || 0
        )
      );
    }, [seriesAnalytics]);

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading && !overview) {
    return (
      <div className="min-h-full bg-[#090909] text-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader
              size={30}
              className="mx-auto animate-spin text-red-500"
            />

            <p className="mt-4 text-sm text-zinc-500">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="min-h-full bg-[#090909] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#090909]/95 backdrop-blur-xl">
        <div className="px-5 py-5 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                  <BarChart3
                    size={22}
                    className="text-red-500"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Analytics
                  </h1>

                  <p className="mt-0.5 text-sm text-zinc-500">
                    Monitor views, watch time and content performance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              {/* RANGE */}
              <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3">
                <CalendarDays
                  size={16}
                  className="text-zinc-500"
                />

                <select
                  value={days}
                  onChange={(e) =>
                    setDays(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="bg-transparent text-sm font-medium text-zinc-200 outline-none"
                >
                  <option
                    value={7}
                    className="bg-[#111]"
                  >
                    Last 7 Days
                  </option>

                  <option
                    value={30}
                    className="bg-[#111]"
                  >
                    Last 30 Days
                  </option>

                  <option
                    value={90}
                    className="bg-[#111]"
                  >
                    Last 90 Days
                  </option>
                </select>
              </div>

              {/* REFRESH */}
              <button
                type="button"
                onClick={() =>
                  fetchAnalytics(
                    true
                  )
                }
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition hover:bg-white/[0.07] disabled:opacity-50"
                title="Refresh analytics"
              >
                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? "animate-spin text-zinc-500"
                      : "text-zinc-300"
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="px-5 py-6 sm:px-7 lg:px-8">

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div>
              <p className="text-sm font-medium text-red-400">
                {error}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Check your analytics API routes and admin authentication.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            OVERVIEW CARDS
        ================================================= */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          <StatCard
            title="Total Views"
            value={formatNumber(
              overview?.totalViews
            )}
            subtitle="All recorded view events"
            icon={Eye}
          />

          <StatCard
            title="Unique Users"
            value={formatNumber(
              overview?.uniqueUsers
            )}
            subtitle="Users with recorded views"
            icon={Users}
          />

          <StatCard
            title="Movie Views"
            value={formatNumber(
              overview?.movieViews
            )}
            subtitle="Movie playback events"
            icon={Film}
          />

          <StatCard
            title="Watch Time"
            value={formatWatchTime(
              overview?.watchTime?.seconds
            )}
            subtitle={`${
              overview?.watchTime?.hours ||
              0
            } total hours`}
            icon={Clock3}
          />
        </div>

        {/* =================================================
            SECONDARY SUMMARY
        ================================================= */}

        <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Episode Views
              </span>

              <Tv
                size={15}
                className="text-zinc-600"
              />
            </div>

            <p className="mt-1.5 text-lg font-semibold">
              {formatNumber(
                overview?.episodeViews
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Watch Minutes
              </span>

              <Clock3
                size={15}
                className="text-zinc-600"
              />
            </div>

            <p className="mt-1.5 text-lg font-semibold">
              {formatNumber(
                overview?.watchTime?.minutes
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Top Movie Views
              </span>

              <TrendingUp
                size={15}
                className="text-zinc-600"
              />
            </div>

            <p className="mt-1.5 text-lg font-semibold">
              {formatNumber(
                topMovies?.[0]?.views
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Top Series Views
              </span>

              <Activity
                size={15}
                className="text-zinc-600"
              />
            </div>

            <p className="mt-1.5 text-lg font-semibold">
              {formatNumber(
                topSeries?.[0]?.views
              )}
            </p>
          </div>
        </div>

        {/* =================================================
            VIEWS TREND
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Views Overview
              </h2>

              <p className="mt-0.5 text-[11px] text-zinc-600">
                Daily view activity for the selected period
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Views
              </span>

              <span>
                {days} days
              </span>
            </div>
          </div>

          {dailyData.length === 0 ? (
            <EmptyState
              title="No view data"
              text="There are no recorded views for this period."
            />
          ) : (
            <div className="px-3 py-4 sm:px-5 sm:py-5">
              <ViewsChart
                data={dailyData}
              />
            </div>
          )}
        </div>

        {/* =================================================
            DAILY SUMMARY
        ================================================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] xl:col-span-2">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Daily Performance
              </h2>

              <p className="mt-0.5 text-[11px] text-zinc-600">
                Views and watch time by day
              </p>
            </div>

            {dailyData.length === 0 ? (
              <EmptyState
                title="No daily data"
                text="Nothing to display yet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Date
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Views
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Movies
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Episodes
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        Watch Time
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.05]">
                    {[...dailyData]
                      .reverse()
                      .map(
                        (day) => (
                          <tr
                            key={
                              day.date
                            }
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-3.5 text-xs font-medium text-zinc-300">
                              {formatFullDate(
                                day.date
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                                <Eye
                                  size={13}
                                  className="text-red-500"
                                />
                                {formatNumber(
                                  day.views
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-xs text-zinc-400">
                              {formatNumber(
                                day.movieViews
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-xs text-zinc-400">
                              {formatNumber(
                                day.episodeViews
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right text-xs text-zinc-400">
                              {formatWatchTime(
                                day
                                  .watchTime
                                  ?.seconds
                              )}
                            </td>
                          </tr>
                        )
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CONTENT MIX */}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Content Mix
              </h2>

              <p className="mt-0.5 text-[11px] text-zinc-600">
                Total views by content type
              </p>
            </div>

            <div className="p-5">

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    <Film
                      size={14}
                      className="text-red-500"
                    />
                    Movies
                  </span>

                  <span className="text-xs font-semibold text-zinc-300">
                    {formatNumber(
                      overview?.movieViews
                    )}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{
                      width: `${
                        (
                          (Number(
                            overview?.movieViews
                          ) || 0) /
                          Math.max(
                            Number(
                              overview?.totalViews
                            ) || 0,
                            1
                          )
                        ) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    <Tv
                      size={14}
                      className="text-zinc-400"
                    />
                    Episodes
                  </span>

                  <span className="text-xs font-semibold text-zinc-300">
                    {formatNumber(
                      overview?.episodeViews
                    )}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-zinc-400 transition-all"
                    style={{
                      width: `${
                        (
                          (Number(
                            overview?.episodeViews
                          ) || 0) /
                          Math.max(
                            Number(
                              overview?.totalViews
                            ) || 0,
                            1
                          )
                        ) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-7 border-t border-white/[0.06] pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Total
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {formatNumber(
                      overview?.totalViews
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Watch Time
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {formatWatchTime(
                      overview
                        ?.watchTime
                        ?.seconds
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            TOP CONTENT
        ================================================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ContentTable
            title="Top Movies"
            icon={Film}
            items={topMovies}
            type="movie"
          />

          <ContentTable
            title="Top Series"
            icon={Tv}
            items={topSeries}
            type="series"
          />
        </div>

        {/* =================================================
            DETAILED ANALYTICS
        ================================================= */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">

          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Content Analytics
              </h2>

              <p className="mt-0.5 text-[11px] text-zinc-600">
                Detailed performance across all content
              </p>
            </div>

            <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "movies"
                  )
                }
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab ===
                  "movies"
                    ? "bg-red-500/10 text-red-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Movies
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "series"
                  )
                }
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab ===
                  "series"
                    ? "bg-red-500/10 text-red-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Series
              </button>
            </div>
          </div>

          {/* MOVIES */}

          {activeTab === "movies" && (
            <>
              {movieAnalytics.length ===
              0 ? (
                <EmptyState
                  title="No movie analytics"
                  text="Movie view data will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Movie
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Views
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Share
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Watch Time
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.05]">
                      {movieAnalytics.map(
                        (
                          movie,
                          index
                        ) => (
                          <tr
                            key={
                              movie.movieId ||
                              index
                            }
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[10px] font-semibold text-zinc-600">
                                  {String(
                                    index +
                                      1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[340px] truncate text-sm font-medium text-zinc-200">
                                    {movie.title ||
                                      "Untitled Movie"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                                <Play
                                  size={13}
                                  className="text-red-500"
                                />

                                {formatNumber(
                                  movie.views
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex min-w-[150px] items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                                  <div
                                    className="h-full rounded-full bg-red-500"
                                    style={{
                                      width: `${
                                        ((Number(
                                          movie.views
                                        ) || 0) /
                                          maxMovieViews) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>

                                <span className="w-10 text-right text-[11px] text-zinc-600">
                                  {Math.round(
                                    ((Number(
                                      movie.views
                                    ) || 0) /
                                      Math.max(
                                        Number(
                                          overview?.totalViews
                                        ) || 0,
                                        1
                                      )) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right text-xs text-zinc-400">
                              {formatWatchTime(
                                movie
                                  .watchTime
                                  ?.seconds
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* SERIES */}

          {activeTab === "series" && (
            <>
              {seriesAnalytics.length ===
              0 ? (
                <EmptyState
                  title="No series analytics"
                  text="Episode view data will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Series
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Views
                        </th>

                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Share
                        </th>

                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Watch Time
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.05]">
                      {seriesAnalytics.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              item.seriesId ||
                              index
                            }
                            className="transition hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[10px] font-semibold text-zinc-600">
                                  {String(
                                    index +
                                      1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[340px] truncate text-sm font-medium text-zinc-200">
                                    {item.title ||
                                      "Untitled Series"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                                <Play
                                  size={13}
                                  className="text-zinc-400"
                                />

                                {formatNumber(
                                  item.views
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex min-w-[150px] items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                                  <div
                                    className="h-full rounded-full bg-zinc-400"
                                    style={{
                                      width: `${
                                        ((Number(
                                          item.views
                                        ) || 0) /
                                          maxSeriesViews) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>

                                <span className="w-10 text-right text-[11px] text-zinc-600">
                                  {Math.round(
                                    ((Number(
                                      item.views
                                    ) || 0) /
                                      Math.max(
                                        Number(
                                          overview?.totalViews
                                        ) || 0,
                                        1
                                      )) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right text-xs text-zinc-400">
                              {formatWatchTime(
                                item
                                  .watchTime
                                  ?.seconds
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* =================================================
            FOOTER INFO
        ================================================= */}

        <div className="mt-6 flex flex-col gap-2 border-t border-white/[0.05] pt-5 text-[11px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Analytics data is based on recorded ViewEvents.
          </span>

          <span>
            Selected period: Last {days} days
          </span>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// LOADER
// =====================================================

const Loader = ({
  size = 24,
  className = "",
}) => {
  return (
    <RefreshCw
      size={size}
      className={className}
    />
  );
};

export default AdminAnalytics;