import React from "react";

export function SystemConfigSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat konfigurasi sistem">
      {/* 1. Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-72 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. 4 Kartu KPI Summary (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`config-kpi-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-gray-border/70 rounded" />
              <div className="h-8 w-8 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-20 bg-gray-border/80 rounded-lg" />
              <div className="h-3 w-36 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Identitas Wilayah Section Box (Layar Awal) */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-gray-border pb-4 space-y-2">
          <div className="h-5 w-48 bg-gray-border/80 rounded-lg" />
          <div className="h-3.5 w-80 bg-gray-border/50 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
