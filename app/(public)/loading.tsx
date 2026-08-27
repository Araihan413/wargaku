import React from "react";

export default function PublicLoading() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-8 space-y-10 animate-pulse">
      {/* 1. Hero Skeleton */}
      <div className="w-full h-80 sm:h-96 bg-slate-200 rounded-3xl" />

      {/* 2. Announcements & Activities Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs"
            >
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-5/6 bg-slate-200 rounded-lg" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Demographics / Charts Skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-56 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
