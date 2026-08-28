import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function ResidentsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat data warga dan hunian">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-72 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Tab Navigation Skeleton */}
      <div className="flex gap-2 border-b border-gray-border pb-1 overflow-x-auto">
        <div className="h-8 w-36 bg-gray-border/80 rounded-lg" />
        <div className="h-8 w-36 bg-gray-border/50 rounded-lg" />
        <div className="h-8 w-36 bg-gray-border/50 rounded-lg" />
        <div className="h-8 w-44 bg-gray-border/50 rounded-lg" />
      </div>

      {/* 3. Filter & Search Bar Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="h-10 flex-1 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="h-10 w-full sm:w-44 rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="h-10 w-full sm:w-44 rounded-xl bg-gray-border/50 border border-gray-border" />
        </div>
      </div>

      {/* 4. Data Table Skeleton */}
      <div className="border border-gray-border rounded-2xl bg-gray-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">No. KK & Kepala Keluarga</th>
                <th className="py-4 px-5">Alamat & Hunian</th>
                <th className="py-4 px-5 text-center">Anggota</th>
                <th className="py-4 px-5">Status Tinggal</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={5} colCount={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
