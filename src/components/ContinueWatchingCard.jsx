import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ContinueWatchingCard = ({ history }) => {
  const navigate = useNavigate();

  if (!history || !history.content) {
    return null;
  }

  const content = history.content;

  const isMovie = history.type === "MOVIE";
  const isEpisode = history.type === "EPISODE";

  // =========================
  // TITLE
  // =========================

  const title = isEpisode
    ? content.series?.title || "Series"
    : content.title || "Untitled";

  // =========================
  // SUBTITLE
  // =========================

  const subtitle = isEpisode
    ? `Season ${content.season?.seasonNumber || 1} • Episode ${
        content.episodeNumber || 1
      }`
    : "Movie";

  // =========================
  // POSTER
  // =========================

  const poster =
    content.backdropUrl ||
    content.posterUrl ||
    content.series?.backdropUrl ||
    content.series?.posterUrl ||
    "";

  // =========================
  // PROGRESS
  // =========================

  const progressSeconds = Number(history.progressSeconds || 0);

  const duration = Number(history.duration || content.duration || 0);

  const progress =
    duration > 0
      ? Math.min(Math.round((progressSeconds / duration) * 100), 100)
      : 0;

  // =========================
  // TIME FORMAT
  // =========================

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) {
      return "0m";
    }

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor((seconds % 3600) / 60);

    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${remainingSeconds}s`;
  };

  // =========================
  // RESUME
  // =========================

  const handleResume = () => {
    if (isMovie) {
      navigate(`/movie/${content.id}`);
      return;
    }

    navigate(`/series/${content.series.id}/episode/${content.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
      className="group w-[280px] shrink-0"
    >
      {/* =========================
          IMAGE
      ========================= */}

      <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
        {poster ? (
          <motion.img
            src={poster}
            alt={title}
            loading="lazy"
            className="h-[155px] w-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{
              duration: 0.45,
            }}
          />
        ) : (
          <div className="flex h-[155px] items-center justify-center bg-zinc-900 text-xs text-zinc-600">
            No Image
          </div>
        )}

        {/* Overlay */}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* =========================
            TYPE
        ========================= */}

        <div className="absolute left-3 top-3">
          <span className="rounded-md bg-red-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
            {isEpisode ? "SERIES" : "MOVIE"}
          </span>
        </div>

        {/* =========================
            PLAY
        ========================= */}

        <motion.button
          onClick={handleResume}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-xl shadow-red-600/30 transition-opacity duration-300 group-hover:opacity-100"
        >
          <Play size={19} fill="currentColor" />
        </motion.button>

        {/* =========================
            TITLE
        ========================= */}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="truncate text-sm font-bold text-white">{title}</h3>

          <p className="mt-1 truncate text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>

      {/* =========================
          PROGRESS
      ========================= */}

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{progress}% watched</span>

          <span>
            {formatTime(progressSeconds)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}

        <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{
              width: `${progress}%`,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="h-full rounded-full bg-red-500"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard;
