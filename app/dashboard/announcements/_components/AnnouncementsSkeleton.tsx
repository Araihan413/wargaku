import React from "react";

export function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat kelola pengumuman warga">
      {/* 1. Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-24 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Header Filters & Add Button Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-card border border-gray-border p-4 rounded-2xl shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="h-10 w-full sm:w-72 rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="h-9 w-full sm:w-64 rounded-xl bg-gray-border/40 border border-gray-border/60" />
        </div>
        <div className="h-10 w-full sm:w-44 rounded-xl bg-gray-border/70 shrink-0" />
      </div>

      {/* 3. List Kartu Pengumuman Skeleton (Layar Awal) */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`announcement-card-${idx}`}
            className="p-4 rounded-2xl border border-gray-border bg-gray-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2.5 flex-1 pr-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-gray-border/70 rounded-lg" />
                <div className="h-4 w-24 bg-gray-border/50 rounded" />
                <div className="h-4 w-28 bg-gray-border/50 rounded" />
              </div>
              <div className="h-5 w-3/4 max-w-md bg-gray-border/80 rounded-lg" />
              <div className="space-y-1">
                <div className="h-3.5 w-full bg-gray-border/50 rounded" />
                <div className="h-3.5 w-4/5 bg-gray-border/50 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <div className="h-8 w-20 bg-gray-border/70 rounded-xl" />
              <div className="h-8 w-8 bg-gray-border/70 rounded-xl" />
              <div className="h-8 w-8 bg-gray-border/70 rounded-xl" />
              <div className="h-8 w-8 bg-gray-border/70 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
