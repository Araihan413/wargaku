import React from "react";

export function SuperAdminDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat dashboard super admin">
      {/* 1. Welcome Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-64 sm:w-80 bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. 6 Kartu Global KPI Summary (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`admin-kpi-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-gray-border/70 rounded" />
              <div className="h-8 w-8 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-20 bg-gray-border/80 rounded-lg" />
              <div className="h-3 w-36 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. 4 Kartu Quick Actions Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`admin-quick-action-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-gray-border/70" />
              <div className="h-4 w-4 rounded bg-gray-border/50" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-20 bg-gray-border/60 rounded" />
              <div className="h-4 w-36 bg-gray-border/80 rounded-md" />
              <div className="space-y-1">
                <div className="h-3 w-full bg-gray-border/50 rounded" />
                <div className="h-3 w-3/4 bg-gray-border/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
