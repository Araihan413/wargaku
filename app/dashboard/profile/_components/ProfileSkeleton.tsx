import React from "react";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat profil pengguna">
      {/* 1. Header Profil Ringkasan Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Placeholder */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-border/70 shrink-0" />

        {/* Profile Details Header */}
        <div className="flex-1 text-center md:text-left space-y-3 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-2.5">
            <div className="h-7 w-48 sm:w-56 bg-gray-border/80 rounded-xl" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-border/60 rounded-full" />
              <div className="h-6 w-24 bg-gray-border/60 rounded-full" />
            </div>
          </div>

          {/* Contact Info List */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 pt-1">
            <div className="h-4 w-36 bg-gray-border/50 rounded-md" />
            <div className="h-4 w-32 bg-gray-border/50 rounded-md" />
            <div className="h-4 w-40 bg-gray-border/50 rounded-md" />
          </div>
        </div>
      </div>

      {/* 2. Tab Navigation Underline Skeleton */}
      <div className="flex border-b border-gray-border gap-6 pb-3 overflow-x-auto">
        <div className="h-5 w-36 bg-gray-border/80 rounded-md" />
        <div className="h-5 w-40 bg-gray-border/50 rounded-md" />
        <div className="h-5 w-44 bg-gray-border/50 rounded-md" />
      </div>

      {/* 3. Form Data Diri Box (Layar Awal) */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-gray-border pb-4 space-y-2">
          <div className="h-5 w-56 bg-gray-border/80 rounded-lg" />
          <div className="h-3.5 w-full max-w-md bg-gray-border/50 rounded-md" />
        </div>

        <div className="space-y-4 max-w-xl">
          {/* Input 1 */}
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>

          {/* Input 2 */}
          <div className="space-y-1.5">
            <div className="h-4 w-24 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>

          {/* Input 3 */}
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-gray-border/70 rounded" />
            <div className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>

          {/* Tombol Simpan */}
          <div className="pt-2">
            <div className="h-10 w-36 bg-gray-border/70 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
