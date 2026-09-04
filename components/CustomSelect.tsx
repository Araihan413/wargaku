"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value = "",
  onChange,
  options,
  placeholder = "Pilih salah satu...",
  emptyText = "Pilihan tidak tersedia",
  label,
  required = false,
  disabled = false,
  className = "",
  size = "md",
  searchable,
  searchPlaceholder = "Cari pilihan...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Auto-enable search if options count is 7 or more, unless explicitly set
  const isSearchEnabled = searchable !== undefined ? searchable : options.length >= 7;

  // Declarative direct filtering (sub-microsecond execution, zero hook overhead)
  const term = searchTerm.toLowerCase().trim();
  const filteredOptions = term
    ? options.filter((opt) => opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term))
    : options;

  const selectedOption = options.find(
    (opt) =>
      opt.value === value ||
      (value && typeof value === "string" && opt.value.replace(/_/g, " ") === value.replace(/_/g, " "))
  );

  // Measure space below to determine opening direction (upward/downward)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 280 && rect.top > spaceBelow);
    }
  }, [isOpen]);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
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
      const listElement = optionsRef.current.querySelector('[role="listbox"]') as HTMLElement;
      if (listElement && listElement.children[focusedIndex]) {
        const activeElement = listElement.children[focusedIndex] as HTMLElement;
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

  const handleSelectOption = (opt: SelectOption) => {
    onChange(opt.value);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Tab") {
      closeDropdown();
      return;
    }

    if (e.key === "Escape") {
      if (isOpen) {
        closeDropdown();
        triggerRef.current?.focus();
        e.preventDefault();
      }
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
        const index = filteredOptions.findIndex((opt) => opt.value === value);
        setFocusedIndex(index >= 0 ? index : 0);
        e.preventDefault();
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      closeDropdown();
      triggerRef.current?.focus();
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetOpt = focusedIndex >= 0 && focusedIndex < filteredOptions.length
        ? filteredOptions[focusedIndex]
        : filteredOptions[0];
      if (targetOpt) {
        handleSelectOption(targetOpt);
      }
    }
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
              const index = filteredOptions.findIndex((opt) => opt.value === value);
              setFocusedIndex(index >= 0 ? index : 0);
            }
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-xl border border-gray-border outline-none transition-all cursor-pointer select-none text-left disabled:opacity-50 disabled:cursor-not-allowed ${
          size === "sm"
            ? "bg-gray-page-bg py-2 px-3.5 text-xs text-gray-heading-main"
            : "bg-gray-card py-2 px-3.5 text-sm text-gray-heading-main"
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
          className={`absolute left-0 z-9999 w-full rounded-2xl border border-gray-border bg-gray-card/95 backdrop-blur-xl p-1.5 shadow-2xl max-h-64 overflow-y-auto outline-none animate-in fade-in duration-150 scrollbar-none ${
            openUpward
              ? "bottom-full mb-1 slide-in-from-bottom-2"
              : "top-full mt-1 slide-in-from-top-2"
          }`}
        >
          {/* Integrated Sticky Search Input with native autoFocus */}
          {isSearchEnabled && (
            <div className="p-1 pb-1.5 border-b border-gray-border/60 mb-1 sticky top-0 bg-gray-card/95 backdrop-blur-md z-20">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-placeholder pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-sidebar-hover/70 border border-gray-border rounded-xl text-gray-heading-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-placeholder font-medium"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                      setFocusedIndex(0);
                    }}
                    className="absolute right-2 p-0.5 text-gray-placeholder hover:text-gray-heading-main cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused = idx === focusedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`flex items-center gap-2 rounded-xl py-2 px-2.5 cursor-pointer transition-colors outline-none select-none ${
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
              })
            ) : (
              <div className="py-3 px-3 text-center text-xs text-gray-placeholder font-medium select-none">
                {searchTerm ? "Hasil tidak ditemukan" : emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
