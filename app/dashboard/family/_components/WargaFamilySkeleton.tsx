import React from "react";

export const WargaFamilySkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat data anggota keluarga">
      {/* 1. Header Halaman Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-64 sm:w-80 bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. KK Info Header Card Skeleton */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-5">
        {/* Row 1: Identity & Badges */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-36 bg-gray-border/70 rounded-md" />
              <div className="h-5 w-28 bg-gray-border/60 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-8 w-72 sm:w-80 bg-gray-border/80 rounded-xl" />
              <div className="h-4 w-52 bg-gray-border/60 rounded-md" />
              <div className="h-3.5 w-44 bg-gray-border/50 rounded-md" />
            </div>
          </div>

          <div className="h-9 w-44 bg-gray-border/70 rounded-xl self-start shrink-0" />
        </div>

        {/* Row 2: Scan KK Document Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gray-border/70 shrink-0" />
            <div className="space-y-1">
              <div className="h-4 w-44 bg-gray-border/70 rounded-md" />
              <div className="h-3 w-36 bg-gray-border/50 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-border/70 rounded-xl" />
            <div className="h-8 w-24 bg-gray-border/70 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 3. Status Alert Banner Skeleton */}
      <div className="flex items-center gap-3 rounded-2xl border border-gray-border bg-gray-card p-4 shadow-xs">
        <div className="h-5 w-5 rounded-full bg-gray-border/70 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-3/4 bg-gray-border/60 rounded-md" />
          <div className="h-3 w-1/2 bg-gray-border/50 rounded-md" />
        </div>
      </div>
    </div>
  );
};
