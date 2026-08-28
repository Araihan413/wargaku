import React from "react";

export function MyPropertiesSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat daftar properti sewa">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-64 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-md bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-gray-border/70 rounded-xl self-start sm:self-auto shrink-0" />
      </div>

      {/* 2. Grid Kartu Properti Sewa (3 Kolom Layar Awal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`property-skeleton-${idx}`}
            className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Title & Badge */}
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1.5">
                  <div className="h-5 w-36 bg-gray-border/80 rounded-md" />
                  <div className="h-3 w-28 bg-gray-border/50 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-border/60 rounded" />
              </div>

              {/* Stats Box 2 Kolom */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-gray-border/60 bg-gray-sidebar-hover/30">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gray-border/70 shrink-0" />
                  <div className="space-y-1 w-full">
                    <div className="h-2.5 w-12 bg-gray-border/50 rounded" />
                    <div className="h-3.5 w-16 bg-gray-border/80 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gray-border/70 shrink-0" />
                  <div className="space-y-1 w-full">
                    <div className="h-2.5 w-12 bg-gray-border/50 rounded" />
                    <div className="h-3.5 w-16 bg-gray-border/80 rounded" />
                  </div>
                </div>
              </div>

              {/* Coordinator / Contact Bar */}
              <div className="p-3 rounded-xl border border-gray-border/40 bg-gray-page-bg flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-border/60 rounded" />
                  <div className="h-2.5 w-32 bg-gray-border/40 rounded" />
                </div>
                <div className="h-7 w-7 rounded-lg bg-gray-border/60" />
              </div>
            </div>

            {/* Tombol Aksi Detail di Bawah */}
            <div className="pt-2">
              <div className="h-10 w-full rounded-xl bg-gray-border/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
