import React from "react";

export function WargaDashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat dashboard warga">
      {/* 1. Banner Hero Skeleton (Presisi dengan WargaHeaderBanner) */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="h-6 w-36 rounded-full bg-gray-border/70" />
            <div className="h-8 sm:h-9 w-64 sm:w-80 rounded-xl bg-gray-border/80" />
            <div className="space-y-1.5 max-w-xl">
              <div className="h-4 w-full bg-gray-border/50 rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-border/50 rounded-lg" />
            </div>
          </div>

          {/* Status KK Placeholder di kanan (Desktop) */}
          <div className="shrink-0 w-full lg:w-64 p-4 rounded-2xl border border-gray-border bg-gray-page-bg flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-border/70 shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 w-24 bg-gray-border/80 rounded" />
              <div className="h-3 w-32 bg-gray-border/50 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Akses Layanan Cepat Skeleton (Presisi dengan WargaQuickActions) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded-xl bg-gray-border/80" />
          <div className="h-3.5 w-28 rounded-md bg-gray-border/50" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={`quick-action-skeleton-${idx}`}
              className="p-4 rounded-2xl border border-gray-border bg-gray-card shadow-xs flex flex-col justify-between h-32"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-gray-border/70" />
                <div className="h-3 w-3 rounded-full bg-gray-border/50" />
              </div>
              <div className="space-y-1.5 mt-2">
                <div className="h-4 w-24 bg-gray-border/80 rounded-md" />
                <div className="h-3 w-full bg-gray-border/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
