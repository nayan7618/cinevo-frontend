import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const Toast = ({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      icon: <CheckCircle2 size={20} />,
      title: "Success",
      className: "border-green-500/20 bg-[#101a14]",
      iconClass: "text-green-400",
      accent: "bg-green-500",
    },
    error: {
      icon: <XCircle size={20} />,
      title: "Error",
      className: "border-red-500/20 bg-[#1a1012]",
      iconClass: "text-red-400",
      accent: "bg-red-500",
    },
    info: {
      icon: <Info size={20} />,
      title: "Info",
      className: "border-blue-500/20 bg-[#10151d]",
      iconClass: "text-blue-400",
      accent: "bg-blue-500",
    },
  };

  const current = styles[type] || styles.success;

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[min(380px,calc(100vw-32px))] animate-[toastIn_.3s_ease-out]">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${current.className}`}
      >
        {/* Accent */}
        <div
          className={`absolute left-0 top-0 h-full w-1 ${current.accent}`}
        />

        <div className="flex items-start gap-3 pl-1">
          <div className={`mt-0.5 shrink-0 ${current.iconClass}`}>
            {current.icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {current.title}
            </p>

            <p className="mt-1 text-sm leading-5 text-zinc-400">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5">
          <div
            className={`h-full ${current.accent} animate-[toastProgress_3s_linear_forwards]`}
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;