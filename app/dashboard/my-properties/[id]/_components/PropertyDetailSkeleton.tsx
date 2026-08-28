import React from "react";

export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat detail properti">
      {/* 1. Top Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gray-border/70 shrink-0" />
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-60 sm:w-72 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-48 bg-gray-border/50 rounded-lg" />
        </div>
      </div>

      {/* 2. Tabs Switcher Skeleton */}
      <div className="flex border-b border-gray-border gap-6 pb-3">
        <div className="h-5 w-36 bg-gray-border/70 rounded-md" />
        <div className="h-5 w-32 bg-gray-border/50 rounded-md" />
        <div className="h-5 w-32 bg-gray-border/50 rounded-md" />
      </div>

      {/* 3. Search & Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-card border border-gray-border p-4 rounded-3xl shadow-xs">
        <div className="h-9 w-full sm:w-80 rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-8 w-20 rounded-xl bg-gray-border/60" />
          <div className="h-8 w-24 rounded-xl bg-gray-border/50" />
        </div>
      </div>

      {/* 4. Grid Kartu Penghuni / Kamar (3 Kolom Layar Awal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`resident-skeleton-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 w-full">
                <div className="h-4 w-32 bg-gray-border/80 rounded" />
                <div className="h-3 w-40 bg-gray-border/50 rounded" />
              </div>
              <div className="h-5 w-16 bg-gray-border/60 rounded" />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-gray-border/60">
              <div className="h-3 w-28 bg-gray-border/60 rounded" />
              <div className="h-3 w-36 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
