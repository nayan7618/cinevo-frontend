import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Star, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const HeroBanner = () => {
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH ACTIVE BANNERS
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const fetchBanners = async () => {
      try {
        setLoading(true);

        const response = await api.get("/home-banners");

        console.log("HOME BANNER RESPONSE:", response.data);

        const list =
          response.data?.banners || response.data?.data?.banners || [];

        if (!mounted) return;

        setBanners(Array.isArray(list) ? list : []);

        setCurrentIndex(0);
      } catch (error) {
        console.error(
          "Home banner fetch error:",
          error.response?.data || error,
        );

        if (!mounted) return;

        setBanners([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBanners();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // AUTO SLIDE
  // =====================================================

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= banners.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // =====================================================
  // PREVIOUS
  // =====================================================

  const handlePrevious = () => {
    if (!banners.length) return;

    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // =====================================================
  // NEXT
  // =====================================================

  const handleNext = () => {
    if (!banners.length) return;

    setCurrentIndex((prev) => (prev >= banners.length - 1 ? 0 : prev + 1));
  };

  // =====================================================
  // WATCH NOW
  // =====================================================

  const handleWatchNow = () => {
    const currentBanner = banners[currentIndex];

    const url = currentBanner?.button?.url;

    if (!url || url === "#") {
      return;
    }

    navigate(url);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="relative mx-4 mt-5 min-h-[420px] overflow-hidden rounded-3xl bg-[#111111] md:mx-6 md:min-h-[500px]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.03] to-transparent" />

        <div className="absolute bottom-10 left-6 md:left-12">
          <div className="h-4 w-24 rounded bg-white/[0.06]" />
          <div className="mt-4 h-10 w-72 rounded bg-white/[0.06]" />
          <div className="mt-4 h-4 w-80 rounded bg-white/[0.04]" />
        </div>
      </section>
    );
  }

  // =====================================================
  // NO ACTIVE BANNER
  // =====================================================

  if (!banners.length) {
    return null;
  }

  const banner = banners[Math.min(currentIndex, banners.length - 1)];

  const metadata = banner?.metadata || {};

  return (
    <section className="relative mx-4 mt-5 min-h-[420px] overflow-hidden rounded-3xl bg-[#111111] md:mx-6 md:min-h-[500px]">
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <AnimatePresence mode="wait">
        <motion.img
          key={banner.id}
          src={banner.imageUrl}
          alt={banner.title || "Featured content"}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{
            scale: 1.08,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{
            opacity: 0,
            scale: 1.03,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </AnimatePresence>

      {/* =================================================
          GRADIENTS
      ================================================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

      <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/20 to-transparent" />

      {/* =================================================
          CONTENT
      ================================================= */}

      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          className="relative flex min-h-[420px] max-w-2xl flex-col justify-end p-6 pb-10 md:min-h-[500px] md:p-12 md:pb-12"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -15,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          {/* BADGE */}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {banner.type || "Featured"}
            </span>

            <span className="text-xs text-zinc-400 md:text-sm">Featured</span>
          </div>

          {/* TITLE */}

          <h1 className="max-w-xl text-3xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            {banner.title}
          </h1>

          {/* META */}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {Number(metadata.rating) > 0 && (
              <span className="flex items-center gap-1.5 text-yellow-400">
                <Star size={16} fill="currentColor" />
                {metadata.rating}
              </span>
            )}

            {metadata.releaseYear && (
              <span className="text-zinc-300">{metadata.releaseYear}</span>
            )}

            {metadata.ageRating && (
              <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-xs text-zinc-300">
                {metadata.ageRating}
              </span>
            )}

            {metadata.duration && (
              <span className="text-zinc-300">
                {Math.floor(metadata.duration / 60)}h {metadata.duration % 60}m
              </span>
            )}

            {metadata.language && (
              <span className="text-zinc-300">{metadata.language}</span>
            )}

            {banner.type && (
              <span className="text-zinc-400">{banner.type}</span>
            )}
          </div>

          {/* GENRES */}

          {Array.isArray(metadata.genres) && metadata.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {metadata.genres.slice(0, 5).map((genre) => (
                <span key={genre} className="text-xs text-zinc-400 md:text-sm">
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* DESCRIPTION */}

          {banner.description && (
            <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
              {banner.description}
            </p>
          )}

          {/* BUTTONS */}

          <div className="mt-7 flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={handleWatchNow}
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="flex items-center gap-3 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 md:px-6"
            >
              <Play size={18} fill="currentColor" />

              {banner.button?.text || "Watch Now"}
            </motion.button>

           <motion.button
  type="button"
  onClick={() => navigate("/my-list")}
  whileHover={{
    scale: 1.04,
    backgroundColor: "rgba(255,255,255,0.15)",
  }}
  whileTap={{
    scale: 0.97,
  }}
  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md md:px-6"
>
  <Plus size={18} />
  My List
</motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* =================================================
          PREV / NEXT
      ================================================= */}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevious}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 md:left-4"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70 md:right-4"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* =================================================
          DOTS
      ================================================= */}

      {banners.length > 1 && (
        <div className="absolute bottom-5 right-6 flex items-center gap-2 md:right-8">
          {banners.map((item, index) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              aria-label={"Go to banner " + (index + 1)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-7 bg-red-600"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
