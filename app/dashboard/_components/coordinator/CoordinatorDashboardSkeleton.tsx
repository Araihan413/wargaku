import React from "react";

export function CoordinatorDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat dashboard koordinator kos">
      {/* 1. Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-72 sm:w-80 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-8 w-44 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Akses Cepat Pengelola (Quick Actions Skeleton) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-4">
        <div className="h-4 w-44 bg-gray-border/80 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`coord-action-skeleton-${idx}`}
              className="flex items-center gap-3 p-3.5 border border-gray-border/70 rounded-xl bg-gray-sidebar-hover/30"
            >
              <div className="h-9 w-9 rounded-lg bg-gray-border/70 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-28 bg-gray-border/80 rounded" />
                <div className="h-2.5 w-36 bg-gray-border/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 4 Kartu KPI Summary (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`coord-kpi-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-gray-border/70 rounded" />
              <div className="h-9 w-9 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-16 bg-gray-border/80 rounded-lg" />
              <div className="h-3 w-32 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
