import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import MovieCard from "./MovieCard";

const MovieRow = ({
  title,
  subtitle,
  movies = [],
  showViewAll = true,
  type = "Movie",
}) => {
  const rowRef = useRef(null);

  const scrollRow = (direction) => {
    if (!rowRef.current) return;

    const amount = direction === "left" ? -600 : 600;

    rowRef.current.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="px-6 pb-8 pt-8">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500 md:text-sm">{subtitle}</p>
          )}
        </div>

        {showViewAll && (
          <motion.button
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-400"
          >
            View All
            <ChevronRight size={16} />
          </motion.button>
        )}
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Button */}
        <motion.button
          onClick={() => scrollRow("left")}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="
            absolute left-0 top-1/2 z-20
            hidden -translate-y-1/2
            items-center justify-center
            rounded-full border border-white/10
            bg-black/70 p-3
            text-white backdrop-blur-md
            transition
            hover:bg-black
            md:flex
            md:opacity-0
            md:group-hover:opacity-100
          "
        >
          <ChevronLeft size={22} />
        </motion.button>

        {/* Movie List */}
        <div
          ref={rowRef}
          className="
            cinevo-scrollbar
            flex gap-5
            overflow-x-auto
            scroll-smooth
            pb-4
          "
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{
                opacity: 0,
                x: 25,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.05, 0.3),
                ease: "easeOut",
              }}
              className="shrink-0"
            >
              <MovieCard
                id={movie.id}
                title={movie.title}
                poster={movie.posterUrl}
                rating={
                  typeof movie.rating === "object"
                    ? movie.rating.average
                    : movie.rating
                }
                year={movie.releaseYear}
                quality={movie.videos?.[0]?.quality || "HD"}
                type={type}
              />
            </motion.div>
          ))}
        </div>

        {/* Right Button */}
        <motion.button
          onClick={() => scrollRow("right")}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="
            absolute right-0 top-1/2 z-20
            hidden -translate-y-1/2
            items-center justify-center
            rounded-full border border-white/10
            bg-black/70 p-3
            text-white backdrop-blur-md
            transition
            hover:bg-black
            md:flex
            md:opacity-0
            md:group-hover:opacity-100
          "
        >
          <ChevronRight size={22} />
        </motion.button>
      </div>
    </section>
  );
};

export default MovieRow;
