import React from "react";

export function NotificationsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat daftar notifikasi">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div className="space-y-2">
          <div className="h-8 w-56 sm:w-64 bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-md bg-gray-border/50 rounded-lg" />
        </div>
      </div>

      {/* 2. Tab Filter Underline Skeleton */}
      <div className="flex gap-2 border-b border-gray-border pb-1 overflow-x-auto">
        <div className="h-6 w-16 bg-gray-border/80 rounded-lg" />
        <div className="h-6 w-24 bg-gray-border/50 rounded-lg" />
        <div className="h-6 w-20 bg-gray-border/50 rounded-lg" />
        <div className="h-6 w-18 bg-gray-border/50 rounded-lg" />
      </div>

      {/* 3. List Kartu Notifikasi Presisi (4 Kartu Layar Awal) */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`notif-skeleton-${idx}`}
            className="flex items-start gap-4 p-4 bg-gray-card border border-gray-border rounded-2xl shadow-xs"
          >
            {/* Icon Box */}
            <div className="h-10 w-10 rounded-xl bg-gray-border/70 shrink-0" />

            {/* Content Body */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-40 sm:w-48 bg-gray-border/80 rounded-md" />
                <div className="h-3.5 w-16 bg-gray-border/50 rounded-md" />
                <div className="h-4 w-12 bg-gray-border/60 rounded-md" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-full max-w-lg bg-gray-border/50 rounded" />
                <div className="h-3 w-2/3 bg-gray-border/50 rounded" />
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-gray-border/60" />
              <div className="h-7 w-7 rounded-lg bg-gray-border/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
