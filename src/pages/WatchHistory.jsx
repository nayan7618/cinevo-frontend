import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Play, Clock3, Film, Tv, CheckCircle2 } from "lucide-react";

const WatchHistory = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/watch-history");

        const data = response.data;

        /*
          Your existing API returns:
          continueWatching: [...]
          
          If backend later returns history separately,
          we can support that too.
        */
        setHistory(
          data.history || data.watchHistory || data.continueWatching || [],
        );
      } catch (err) {
        console.error("Watch history error:", err);

        setError(err.response?.data?.message || "Failed to load watch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getTitle = (item) => {
    if (item.type === "EPISODE") {
      return item.content?.title || "Episode";
    }

    return item.content?.title || "Movie";
  };

  const getProgress = (item) => {
    if (!item.duration || item.duration <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, (item.progressSeconds / item.duration) * 100),
    );
  };

  const formatTime = (seconds = 0) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  };

  const handleResume = (item) => {
    if (item.type === "MOVIE") {
      navigate(`/watch/movie/${item.content?.id}`);
      return;
    }

    if (item.type === "EPISODE") {
      const seriesId = item.content?.seriesId || item.content?.series?.id;

      const episodeId = item.content?.id;

      if (seriesId && episodeId) {
        navigate(`/series/${seriesId}/episode/${episodeId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Watch History</h1>

          <p className="mt-2 text-sm text-zinc-500">
            Continue watching movies and episodes you've started.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[300px] animate-pulse rounded-2xl bg-white/[0.04]"
              />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.04] px-6 py-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && history.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-20 text-center">
            <Clock3 size={42} className="mx-auto mb-4 text-zinc-700" />

            <h2 className="text-lg font-semibold">No watch history yet</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Start watching a movie or series and it will appear here.
            </p>

            <button
              onClick={() => navigate("/home")}
              className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500"
            >
              Browse Content
            </button>
          </div>
        )}

        {/* HISTORY GRID */}
        {!loading && !error && history.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {history.map((item) => {
              const progress = getProgress(item);

              const isEpisode = item.type === "EPISODE";
              const isCompleted = item.completed;

              const title = getTitle(item);

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]"
                >
                  {/* THUMBNAIL */}
                  <div className="relative aspect-video overflow-hidden bg-zinc-900">
                    {item.content?.thumbnailUrl || item.content?.posterUrl ? (
                      <img
                        src={
                          item.content.thumbnailUrl || item.content.posterUrl
                        }
                        alt={title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                        {isEpisode ? (
                          <Tv size={42} className="text-zinc-700" />
                        ) : (
                          <Film size={42} className="text-zinc-700" />
                        )}
                      </div>
                    )}

                    {/* TYPE */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold uppercase backdrop-blur">
                      {isEpisode ? (
                        <>
                          <Tv size={12} />
                          Episode
                        </>
                      ) : (
                        <>
                          <Film size={12} />
                          Movie
                        </>
                      )}
                    </div>

                    {/* COMPLETED */}
                    {isCompleted && (
                      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-green-500/90 px-2.5 py-1.5 text-[10px] font-semibold text-white">
                        <CheckCircle2 size={12} />
                        Completed
                      </div>
                    )}

                    {/* PLAY */}
                    <button
                      onClick={() => handleResume(item)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-xl transition hover:scale-110 hover:bg-red-500">
                        <Play
                          size={20}
                          fill="currentColor"
                          className="ml-0.5"
                        />
                      </span>
                    </button>

                    {/* PROGRESS */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4">
                    <div className="min-h-[48px]">
                      <h2 className="line-clamp-2 text-sm font-semibold text-white">
                        {title}
                      </h2>

                      {isEpisode && item.content?.episodeNumber && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Episode {item.content.episodeNumber}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>
                        {formatTime(item.progressSeconds)}
                        {" / "}
                        {formatTime(item.duration)}
                      </span>

                      <span>{Math.round(progress)}%</span>
                    </div>

                    {/* RESUME */}
                    <button
                      onClick={() => handleResume(item)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600"
                    >
                      <Play size={14} fill="currentColor" />

                      {isCompleted ? "Watch Again" : "Resume Watching"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchHistory;
