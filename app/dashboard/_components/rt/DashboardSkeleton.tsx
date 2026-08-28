import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat data dashboard Ketua RT">
      {/* 1. Welcome Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-64 bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-80 sm:w-96 max-w-full bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. 4 Kartu KPI Utama RT (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`rt-kpi-${idx}`}
            className="p-6 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="h-3.5 w-24 bg-gray-border/70 rounded" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-8 w-16 bg-gray-border/80 rounded-lg" />
              <div className="h-11 w-11 rounded-xl bg-gray-border/80" />
            </div>
            <div className="h-3 w-32 bg-gray-border/50 rounded pt-0.5" />
          </div>
        ))}
      </div>

      {/* 3. Section Grafik Mutasi Penduduk (Layar Awal) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-gray-border/80 rounded-lg" />
            <div className="h-3.5 w-64 sm:w-80 max-w-full bg-gray-border/50 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-28 bg-gray-border/60 rounded" />
            <div className="h-4 w-28 bg-gray-border/60 rounded" />
          </div>
        </div>

        <div className="h-48 sm:h-56 w-full rounded-xl bg-gray-border/30" />
      </div>
    </div>
  );
}
