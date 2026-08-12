"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  containerClassName?: string;
  className?: string;
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Cari...",
  containerClassName = "relative w-full sm:max-w-128",
  className = "",
  onClear,
  isLoading = false,
  ...props
}) => {
  return (
    <div className={`relative ${containerClassName}`}>
      {isLoading ? (
        <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin pointer-events-none" />
      ) : (
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-placeholder pointer-events-none" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-9 py-2 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${className}`}
        {...props}
      />
      {value && !isLoading && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-sidebar-hover text-gray-placeholder hover:text-gray-heading-main transition cursor-pointer"
          title="Bersihkan pencarian"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
