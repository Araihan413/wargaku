import React from "react";

export function MyFeesSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat status dan histori iuran">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-5">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-72 sm:w-80 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-gray-border/70 rounded-xl shrink-0" />
      </div>

      {/* 2. Info Banner Skeleton */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-4 flex items-start gap-3 shadow-xs">
        <div className="h-5 w-5 rounded-full bg-gray-border/70 shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-60 bg-gray-border/80 rounded-md" />
          <div className="h-3.5 w-full max-w-xl bg-gray-border/50 rounded-md" />
        </div>
      </div>

      {/* 3. 4 Kartu KPI Ringkasan Iuran (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`my-fee-kpi-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-36 bg-gray-border/70 rounded" />
              <div className="h-9 w-9 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-6 w-24 bg-gray-border/80 rounded-full" />
              <div className="h-3.5 w-32 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
