import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown } from "lucide-react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Pilih salah satu...",
  label,
  required = false,
  disabled = false,
  className = "",
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Measure space below to determine opening direction (upward/downward)
  useIsomorphicLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below is less than 240px and space above is greater, open upward
      setOpenUpward(spaceBelow < 240 && rect.top > spaceBelow);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync scroll position of options container when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionsRef.current) {
      const activeElement = optionsRef.current.children[focusedIndex] as HTMLElement;
      if (activeElement) {
        const container = optionsRef.current;
        const elemTop = activeElement.offsetTop;
        const elemBottom = elemTop + activeElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [focusedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (e.key === "Escape") {
      if (isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
        e.preventDefault();
      }
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
        const index = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(index >= 0 ? index : 0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        e.preventDefault();
        break;
      case "ArrowUp":
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        e.preventDefault();
        break;
      case "Enter":
      case " ":
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const handleSelectOption = (opt: SelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <span className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              const index = options.findIndex((opt) => opt.value === value);
              setFocusedIndex(index >= 0 ? index : 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-xl border border-gray-border outline-none transition-all cursor-pointer select-none text-left disabled:opacity-50 disabled:cursor-not-allowed ${
          size === "sm"
            ? "bg-gray-page-bg py-2 px-3.5 text-xs text-gray-heading-main"
            : "bg-gray-card py-2.5 px-3.5 text-sm text-gray-heading-main"
        } ${
          isOpen ? "border-primary ring-2 ring-primary/20" : "focus:border-primary focus:ring-2 focus:ring-primary/20"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon
              className={`shrink-0 text-gray-placeholder ${
                size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5"
              }`}
            />
          )}
          <span className={selectedOption ? "text-gray-heading-main" : "text-gray-placeholder"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`shrink-0 text-gray-placeholder transition-transform duration-200 ${
            size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5"
          } ${isOpen ? "transform rotate-180 text-primary" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          ref={optionsRef}
          role="listbox"
          className={`absolute left-0 z-50 w-full rounded-xl border border-gray-border bg-gray-card/95 backdrop-blur-xl p-1.5 shadow-xl max-h-60 overflow-y-auto outline-none animate-in fade-in duration-150 scrollbar-none ${
            openUpward
              ? "bottom-full mb-1.5 slide-in-from-bottom-2"
              : "top-full mt-1.5 slide-in-from-top-2"
          }`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectOption(opt)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`flex items-center gap-2 rounded-lg py-2 px-2.5 cursor-pointer transition-colors outline-none select-none ${
                  size === "sm" ? "text-xs" : "text-sm"
                } ${
                  isSelected
                    ? "bg-primary/10 text-primary font-bold"
                    : isFocused
                    ? "bg-gray-sidebar-hover text-gray-heading-main"
                    : "text-gray-secondary-text hover:text-gray-heading-main"
                }`}
              >
                {opt.icon && (
                  <opt.icon
                    className={`shrink-0 ${
                      size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5"
                    } ${isSelected ? "text-primary" : "text-gray-placeholder"}`}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
