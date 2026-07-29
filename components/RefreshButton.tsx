"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  isLoading = false,
  label = "Refres",
  className = "",
  size = "md",
}) => {
  const sizeClasses =
    size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-5 py-2.5 text-xs";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-xl border border-gray-border bg-gray-card h-max ${sizeClasses} font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition shadow-xs cursor-pointer disabled:opacity-60 ${className}`}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
      <span>{label}</span>
    </button>
  );
};
