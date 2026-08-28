import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export const FamilyDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat rincian kartu keluarga">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-border/50 border border-gray-border shrink-0" />
          <div className="space-y-2">
            <div className="h-8 sm:h-9 w-48 sm:w-72 max-w-full bg-gray-border/80 rounded-xl" />
            <div className="h-4 w-full max-w-lg bg-gray-border/50 rounded-lg" />
          </div>
        </div>
        <div className="h-10 w-36 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Family Detail Card Skeleton */}
      <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-32 bg-gray-border/60 rounded-md" />
              <div className="h-5 w-24 bg-gray-border/70 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-72 sm:w-80 bg-gray-border/80 rounded-lg" />
              <div className="h-4 w-52 bg-gray-border/60 rounded-md" />
              <div className="h-3.5 w-64 bg-gray-border/50 rounded-md" />
            </div>
          </div>
          <div className="h-9 w-40 bg-gray-border/70 rounded-xl self-start shrink-0" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-border/60">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`family-stat-${idx}`} className="p-3 rounded-2xl bg-gray-sidebar-hover/60 space-y-1.5 border border-gray-border/40">
              <div className="h-3 w-16 bg-gray-border/60 rounded" />
              <div className="h-5 w-20 bg-gray-border/80 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Family Members Table Skeleton */}
      <div className="border border-gray-border rounded-2xl bg-gray-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-border flex items-center justify-between">
          <div className="h-5 w-44 bg-gray-border/80 rounded-lg" />
          <div className="h-4 w-24 bg-gray-border/50 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Nama & NIK</th>
                <th className="py-4 px-5">Hubungan</th>
                <th className="py-4 px-5">Jenis Kelamin</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={3} colCount={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
