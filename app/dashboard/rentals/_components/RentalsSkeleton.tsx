import React from "react";

export function RentalsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat kelola properti sewa">
      {/* 1. Property Header Selector Skeleton */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gray-border/70 shrink-0" />
            <div className="space-y-2">
              <div className="h-7 w-56 sm:w-64 bg-gray-border/80 rounded-xl" />
              <div className="h-3.5 w-44 bg-gray-border/50 rounded" />
            </div>
          </div>
          <div className="h-9 w-36 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
        </div>

        {/* 3 Kolom Stats Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`rental-stat-${idx}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-gray-sidebar-hover/30 border border-gray-border/70"
            >
              <div className="space-y-1.5 w-full">
                <div className="h-2.5 w-24 bg-gray-border/60 rounded" />
                <div className="h-5 w-20 bg-gray-border/80 rounded" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-gray-border/60 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Quick Edit Keterisian Kamar Bar */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-4 sm:p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-border/70" />
          <div className="h-4 w-52 bg-gray-border/80 rounded" />
        </div>
        <div className="h-7 w-24 bg-gray-border/70 rounded-lg" />
      </div>

      {/* 3. Daftar Penyewa Ringkas (Layar Awal) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-gray-border/80 rounded" />
          <div className="h-9 w-36 bg-gray-border/70 rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`tenant-skeleton-${idx}`}
              className="p-3.5 rounded-xl border border-gray-border bg-gray-page-bg flex items-center justify-between gap-3"
            >
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-40 bg-gray-border/80 rounded" />
                <div className="h-2.5 w-28 bg-gray-border/50 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-border/60 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
