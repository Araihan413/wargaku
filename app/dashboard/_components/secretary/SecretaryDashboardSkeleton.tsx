import React from "react";

export function SecretaryDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat data dashboard Sekretaris RT">
      {/* 1. Welcome Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-64 bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-80 sm:w-96 max-w-full bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. 3 Kartu KPI Summary (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`secretary-kpi-${idx}`}
            className="flex flex-col justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-32 bg-gray-border/70 rounded" />
              <div className="h-9 w-9 rounded-xl bg-gray-border/80" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div className="h-7 w-12 bg-gray-border/80 rounded-lg" />
              <div className="h-5 w-14 bg-gray-border/60 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Section Persetujuan Akun Warga Mandiri (Layar Awal) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gray-border/80 shrink-0" />
            <div className="space-y-1">
              <div className="h-4 w-48 bg-gray-border/80 rounded" />
              <div className="h-3 w-64 max-w-full bg-gray-border/50 rounded" />
            </div>
          </div>
          <div className="h-4 w-28 bg-gray-border/60 rounded self-start sm:self-auto" />
        </div>

        {/* 2 Row Items Placeholder */}
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={`secretary-pending-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-border bg-gray-sidebar-hover/40"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-border/70 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-border/80 rounded" />
                  <div className="h-3 w-48 bg-gray-border/50 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="h-8 w-20 bg-gray-border/70 rounded-xl" />
                <div className="h-8 w-16 bg-gray-border/70 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
