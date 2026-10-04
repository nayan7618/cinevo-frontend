import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const AnimatedSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value) || null;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative w-full"
    >
      {/* TRIGGER */}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm transition-all duration-200 ${
          open
            ? "border-red-500/50 bg-[#1a1a21] text-white shadow-lg shadow-red-950/20"
            : "border-white/10 bg-[#17171d] text-zinc-300 hover:border-white/20 hover:bg-[#1a1a21]"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >
        <span
          className={
            selectedOption
              ? "truncate text-white"
              : "truncate text-zinc-500"
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`ml-3 shrink-0 text-zinc-500 transition-transform duration-300 ${
            open ? "rotate-180 text-red-500" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}

      <div
        className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 origin-top overflow-hidden rounded-xl border border-white/10 bg-[#111116]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                  isSelected
                    ? "bg-red-500/10 text-red-400"
                    : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span>{option.label}</span>

                {isSelected && (
                  <Check
                    size={15}
                    className="text-red-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnimatedSelect;