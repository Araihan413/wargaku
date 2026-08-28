import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function SmartGroupsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat kelompok warga filter terpadu">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Citizen Filter Bar Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-10 w-full sm:w-72 rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="h-10 w-full sm:w-80 rounded-xl bg-gray-border/50 border border-gray-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`smart-filter-${idx}`} className="h-10 w-full rounded-xl bg-gray-border/50 border border-gray-border" />
          ))}
        </div>
      </div>

      {/* 3. Main Results Table Section Skeleton */}
      <div className="border border-gray-border bg-gray-card rounded-2xl shadow-xs overflow-hidden p-4 md:p-5 space-y-4">
        <div className="space-y-1.5 pb-4 border-b border-gray-border">
          <div className="h-5 w-56 bg-gray-border/80 rounded-lg" />
          <div className="h-3.5 w-72 bg-gray-border/50 rounded" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">Nama Lengkap & NIK</th>
                <th className="py-3.5 px-4">L/P</th>
                <th className="py-3.5 px-4">Usia</th>
                <th className="py-3.5 px-4">Hubungan</th>
                <th className="py-3.5 px-4">Blok & Rumah</th>
                <th className="py-3.5 px-4">Agama</th>
                <th className="py-3.5 px-4">Pendidikan</th>
                <th className="py-3.5 px-4">Pekerjaan</th>
                <th className="py-3.5 px-4 text-center">Status Iuran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              <TableSkeleton rowCount={5} colCount={10} showActionButtons={false} cellPadding="py-3 px-4" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
