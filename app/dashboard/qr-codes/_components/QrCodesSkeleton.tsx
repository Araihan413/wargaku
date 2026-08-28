import React from "react";

export function QrCodesSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat modul QR Code">
      {/* 1. Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-48 sm:w-72 max-w-full bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. Main 3-Tab Navigation Bar Skeleton */}
      <div className="flex border-b border-gray-border pb-1 overflow-x-auto gap-2 scrollbar-none">
        <div className="h-8 w-28 sm:w-36 bg-gray-border/80 rounded-lg shrink-0" />
        <div className="h-8 w-28 sm:w-36 bg-gray-border/50 rounded-lg shrink-0" />
        <div className="h-8 w-28 sm:w-36 bg-gray-border/50 rounded-lg shrink-0" />
      </div>

      {/* 3. Informational Banner Skeleton */}
      <div className="h-12 w-full rounded-2xl bg-gray-card border border-gray-border" />

      {/* 4. Setting Card Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-border pb-4">
          <div className="h-10 w-10 rounded-xl bg-gray-border/80 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-5 w-44 sm:w-64 max-w-full bg-gray-border/80 rounded-lg" />
            <div className="h-3.5 w-full max-w-md bg-gray-border/50 rounded" />
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <div className="h-4 w-32 max-w-full bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-32 max-w-full bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-40 max-w-full bg-gray-border/70 rounded" />
            <div className="h-20 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
