import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import AdLabel from "./AdLabel";

const COOLDOWN_MS = 5 * 60 * 1000;

const HilltopPlayerBanner = ({ zoneId = "", adCode = "" }) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);
  const adContainerRef = useRef(null);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Load ad
  useEffect(() => {
    if (!visible || !adContainerRef.current) {
      return;
    }

    const container = adContainerRef.current;

    // Clear previous content
    container.innerHTML = "";

    // Temporary placeholder
    if (!adCode?.trim()) {
      container.innerHTML = `
        <div
          style="
            width:300px;
            height:250px;
            max-width:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#111118;
            color:#71717a;
            text-align:center;
            font-family:Arial,sans-serif;
          "
        >
          <div>
            <div style="font-size:13px;font-weight:600;">
              HilltopAds
            </div>

            <div
              style="
                margin-top:6px;
                font-size:11px;
                color:#52525b;
              "
            >
              Advertisement
            </div>
          </div>
        </div>
      `;

      return;
    }

    // Real Hilltop code
    try {
      const template = document.createElement("template");

      template.innerHTML = adCode.trim();

      const nodes = Array.from(
        template.content.childNodes,
      );

      nodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.tagName === "SCRIPT"
        ) {
          const script = document.createElement("script");

          Array.from(node.attributes).forEach(
            (attribute) => {
              script.setAttribute(
                attribute.name,
                attribute.value,
              );
            },
          );

          script.textContent =
            node.textContent || "";

          container.appendChild(script);
        } else {
          container.appendChild(
            node.cloneNode(true),
          );
        }
      });

      console.log(
        "✅ Hilltop player ad loaded:",
        zoneId,
      );
    } catch (error) {
      console.error(
        "❌ Hilltop player ad error:",
        error,
      );
    }
  }, [visible, adCode, zoneId]);

  // Close → reopen after 5 minutes
  const handleClose = () => {
    setVisible(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    console.log(
      "❌ Player banner closed. Reopening in 5 minutes...",
    );

    timerRef.current = window.setTimeout(() => {
      setVisible(true);

      console.log(
        "✅ Player banner shown again.",
      );
    }, COOLDOWN_MS);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="mt-4 w-full">
      <div className="mx-auto w-fit max-w-full">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
          <AdLabel />

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black"
            aria-label="Close advertisement"
          >
            <X size={14} />
          </button>

          {/* 300x250 Ad */}
          <div
            ref={adContainerRef}
            className="flex min-h-[250px] w-[300px] max-w-full items-center justify-center overflow-hidden bg-[#111118]"
          />
        </div>
      </div>
    </div>
  );
};

export default HilltopPlayerBanner;