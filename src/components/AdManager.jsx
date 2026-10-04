import React, { useEffect, useRef,useState } from "react";

const AdManager = ({
  adType = "preRoll",
  onComplete,
  onSkip,
  skipAfter = 10,
  duration = 15,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setCanSkip(false);
  }, [duration, adType]);

  const completedRef = useRef(false);

useEffect(() => {
  completedRef.current = false;
  setTimeLeft(duration);
  setCanSkip(false);
}, [duration, adType]);

useEffect(() => {
  if (completedRef.current) {
    return;
  }

  if (timeLeft <= 0) {
    completedRef.current = true;

    onComplete?.();

    return;
  }

  const timer = window.setTimeout(() => {
    setTimeLeft((prev) => Math.max(prev - 1, 0));
  }, 1000);

  return () => {
    window.clearTimeout(timer);
  };
}, [timeLeft, onComplete]);

useEffect(() => {
  const elapsed = duration - timeLeft;

  if (elapsed >= skipAfter) {
    setCanSkip(true);
  } else {
    setCanSkip(false);
  }
}, [duration, timeLeft, skipAfter]);

  const handleSkip = () => {
  if (!canSkip || completedRef.current) {
    return;
  }

  completedRef.current = true;

  onSkip?.();
  onComplete?.();
};

  const getLabel = () => {
    switch (adType) {
      case "preRoll":
        return "Advertisement";

      case "midRoll":
        return "Advertisement";

      case "postRoll":
        return "Advertisement";

      default:
        return "Advertisement";
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black">
      {/* Fake/Test Ad Area */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-800">
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 w-full max-w-2xl px-6 text-center">
          <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
            {getLabel()}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">
              Test Advertisement
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-4xl">
              Your Advertisement Here
            </h2>

            <p className="mt-3 text-sm text-white/60">
              Production mein yahan HilltopAds / Monetag /
              Google VAST ad render hoga.
            </p>

            <div className="mt-8">
              <div className="text-4xl font-bold text-white">
                {timeLeft}
              </div>

              <p className="mt-1 text-xs text-white/40">
                seconds remaining
              </p>
            </div>

            {/* Progress */}
            <div className="mx-auto mt-6 h-1.5 max-w-md overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-red-600 transition-all duration-1000"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((duration - timeLeft) /
                        Math.max(duration, 1)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>

            {/* Skip */}
            {canSkip ? (
              <button
                type="button"
                onClick={handleSkip}
                className="mt-7 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Skip Ad
              </button>
            ) : (
              <div className="mt-7 text-sm text-white/50">
                Skip available in{" "}
                {Math.max(
                  skipAfter -
                    (duration - timeLeft),
                  0,
                )}
                s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdManager;