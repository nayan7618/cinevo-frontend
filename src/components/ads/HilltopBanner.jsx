import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import AdLabel from "./AdLabel";

const COOLDOWN_MS = 5 * 60 * 1000;

const HilltopBanner = ({ zoneId = "" }) => {
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log("📺 Hilltop banner zone:", zoneId || "not configured");
  }, [zoneId]);

  const handleClose = () => {
    setVisible(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    console.log("❌ Banner closed");

    timerRef.current = setTimeout(() => {
      console.log("✅ Banner showing again after 5 minutes");
      setVisible(true);
    }, COOLDOWN_MS);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3 sm:bottom-6 sm:justify-end sm:px-6 lg:bottom-8 lg:px-8">
      <div className="pointer-events-auto relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">

        <AdLabel />

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black"
          aria-label="Close advertisement"
        >
          <X size={14} />
        </button>

        <div className="flex aspect-[4/3] items-center justify-center bg-[#111118] text-center">
          <div>
            <p className="text-xs font-medium text-zinc-400">
              HilltopAds
            </p>

            <p className="mt-1 text-[11px] text-zinc-600">
              Advertisement
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HilltopBanner;