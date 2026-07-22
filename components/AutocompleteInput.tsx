"use client";

import React, { useState, useRef, useEffect } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder = "",
  className = "",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions directly during render (avoiding useEffect state cascading renders)
  const filtered = React.useMemo(() => {
    if (!value.trim()) {
      return suggestions;
    }
    return suggestions.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase())
    );
  }, [value, suggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border border-gray-border bg-gray-page-bg px-3.5 py-2 text-xs text-gray-heading-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${className}`}
      />

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-border bg-white py-1 shadow-lg [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {filtered.map((item, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-heading-main hover:bg-gray-sidebar-hover cursor-pointer transition-colors"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
