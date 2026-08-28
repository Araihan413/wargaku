import React from "react";

export function NeighborhoodSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat peta hunian dan tetangga">
      {/* 1. Header Halaman Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-64 sm:w-80 bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Kolom Kiri: Search & Resident List */}
        <div className="space-y-4 lg:col-span-1">
          {/* Search Input Placeholder */}
          <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />

          {/* List Kartu Tetangga Ringkas (Layar Awal) */}
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`neighbor-skeleton-${idx}`}
                className="p-3.5 rounded-xl border border-gray-border bg-gray-card shadow-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-2 w-full">
                  <div className="h-3.5 w-32 bg-gray-border/80 rounded" />
                  <div className="h-3 w-40 bg-gray-border/60 rounded" />
                  <div className="h-3 w-16 bg-gray-border/40 rounded" />
                </div>
                <div className="h-5 w-5 rounded-md bg-gray-border/60 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Peta Interaktif Placeholder */}
        <div className="lg:col-span-2 h-105 rounded-2xl border border-gray-border bg-gray-card shadow-xs flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gray-border/70" />
            <div className="h-3.5 w-36 bg-gray-border/50 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
