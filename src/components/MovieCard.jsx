import { motion } from "framer-motion";
import { Play, Plus, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MovieCard = ({
  id,
  title,
  poster,
  rating,
  year,
  quality = "HD",
  type = "Movie",
  season,
  episode,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
  if (type === "Series") {
    navigate(`/series/${id}`);
  } else {
    navigate(`/movie/${id}`);
  }
};

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{
        y: -8,
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="group w-[170px] shrink-0 cursor-pointer sm:w-[190px] md:w-[210px]"
    >
      {/* Poster Container */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
        {/* Poster */}
        {poster ? (
          <motion.img
            src={poster}
            alt={title || "Movie"}
            loading="lazy"
            className="h-[250px] w-full object-cover sm:h-[275px] md:h-[300px]"
            whileHover={{
              scale: 1.06,
            }}
            transition={{
              duration: 0.45,
              ease: "easeOut",
            }}
          />
        ) : (
          <div className="flex h-[250px] items-center justify-center bg-zinc-900 text-xs text-zinc-600 sm:h-[275px] md:h-[300px]">
            No Image
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          {/* Type */}
          <span className="rounded-md bg-red-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
            {type}
          </span>

          {/* Quality */}
          {quality && (
            <span className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-md">
              {quality}
            </span>
          )}
        </div>

        {/* Rating */}
        {rating !== undefined && rating !== null && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs backdrop-blur-md">
            <Star
              size={12}
              fill="currentColor"
              className="text-yellow-400"
            />

            <span className="text-white">
              {Number(rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Center Play */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.7,
          }}
          whileHover={{
            opacity: 1,
            scale: 1,
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 shadow-xl shadow-red-600/30">
            <Play
              size={19}
              fill="currentColor"
              className="ml-0.5 text-white"
            />
          </div>
        </motion.div>

        {/* Bottom Title */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="truncate text-sm font-bold text-white">
            {title}
          </h3>
        </div>

        {/* My List */}
        <motion.button
          onClick={(event) => {
            event.stopPropagation();

            // My List functionality baad mein connect karenge
            console.log("Add to My List:", id);
          }}
          whileHover={{
            scale: 1.08,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 hover:bg-white/20"
        >
          <Plus size={15} />
        </motion.button>
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {/* Year */}
        {year && <span>{year}</span>}

        {/* Separator */}
        {year && type && (
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
        )}

        {/* Type */}
        {type && <span>{type}</span>}

        {/* Series Season / Episode */}
        {type === "Series" &&
          season !== undefined &&
          episode !== undefined && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />

              <span>
                S{season} • E{episode}
              </span>
            </>
          )}
      </div>
    </motion.div>
  );
};

export default MovieCard;