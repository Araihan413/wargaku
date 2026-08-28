import React from "react";

export function TreasurerDashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat data dashboard Bendahara RT">
      {/* 1. Welcome Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-64 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-80 sm:w-96 max-w-full bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-24 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. 4 Kartu KPI Keuangan (Layar Awal) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`treasurer-kpi-${idx}`}
            className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-gray-border/70 rounded" />
              <div className="h-9 w-9 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-28 bg-gray-border/80 rounded-lg" />
              <div className="h-3 w-32 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Section Ringkasan Arus Kas (Layar Awal) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-gray-border bg-gray-card rounded-2xl p-6 shadow-xs space-y-5">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-gray-border/80 rounded-lg" />
            <div className="h-3.5 w-72 max-w-full bg-gray-border/50 rounded" />
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-36 bg-gray-border/60 rounded" />
                <div className="h-4 w-24 bg-gray-border/70 rounded" />
              </div>
              <div className="h-3 w-full bg-gray-border/40 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-36 bg-gray-border/60 rounded" />
                <div className="h-4 w-24 bg-gray-border/70 rounded" />
              </div>
              <div className="h-3 w-full bg-gray-border/40 rounded-full" />
            </div>
          </div>
        </div>

        <div className="border border-gray-border bg-gray-card rounded-2xl p-6 shadow-xs space-y-4">
          <div className="h-5 w-36 bg-gray-border/80 rounded-lg" />
          <div className="h-3.5 w-44 bg-gray-border/50 rounded" />
          <div className="h-20 w-full bg-gray-border/40 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
