import { useEffect, useRef, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import adService from "@/services/ads/adService";
import AdLabel from "./AdLabel";

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const INITIAL_DELAY_MS = 6000; // 6 seconds

const FloatingBannerAd = ({ banner }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  // Clear any existing timer
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Initial show + closed cooldown handling
  useEffect(() => {
    clearTimer();

    if (!banner) {
      setVisible(false);
      return;
    }

    const closedAt = sessionStorage.getItem("cinebox_ad_closed_at");

    // No previous close -> show after 6 seconds
    if (!closedAt) {
      timerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, INITIAL_DELAY_MS);

      return () => clearTimer();
    }

    const elapsed = Date.now() - Number(closedAt);

    // 5 minutes already passed -> show after 6 seconds
    if (elapsed >= COOLDOWN_MS) {
      timerRef.current = window.setTimeout(() => {
        setVisible(true);
      }, INITIAL_DELAY_MS);

      return () => clearTimer();
    }

    // Still inside 5-minute cooldown
    const remaining = COOLDOWN_MS - elapsed;

    timerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, remaining);

    return () => clearTimer();
  }, [banner]);

  // Show actual ad through adService
  useEffect(() => {
    if (!visible || !banner) return;

    adService
      .showBanner({
        zoneId: banner.zoneId,
        containerId: "cinebox-floating-banner",
      })
      .then((result) => {
        console.log("📺 Floating banner ad:", result);
      })
      .catch((error) => {
        console.error("❌ Floating banner ad error:", error);
      });
  }, [visible, banner]);

  // Close banner
  const handleClose = () => {
    setVisible(false);

    sessionStorage.setItem(
      "cinebox_ad_closed_at",
      String(Date.now())
    );

    // Start 5-minute timer
    clearTimer();

    timerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, COOLDOWN_MS);
  };

  // Open advertiser link
  const handleClick = () => {
    if (!banner.linkUrl) return;

    window.open(
      banner.linkUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!banner || !visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3 sm:bottom-6 sm:justify-end sm:px-6 lg:bottom-8 lg:px-8">
      <div
        id="cinebox-floating-banner"
        className="pointer-events-auto relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50"
      >
        <AdLabel />

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-black"
          aria-label="Close advertisement"
        >
          <X size={14} />
        </button>

        <button
          type="button"
          onClick={handleClick}
          disabled={!banner.linkUrl}
          className="group block w-full text-left"
        >
          <img
            src={banner.imageUrl}
            alt={banner.title || "Advertisement"}
            className="block aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />

          {banner.title && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {banner.title}
                </p>

                {banner.description && (
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {banner.description}
                  </p>
                )}
              </div>

              {banner.linkUrl && (
                <ExternalLink
                  size={14}
                  className="shrink-0 text-zinc-500 transition group-hover:text-white"
                />
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingBannerAd;