import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function ComplaintsSkeleton() {
  return (
    <div className="space-y-8 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat kelola pengaduan warga">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-24 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. 5 Kartu KPI Status Pengaduan (Layar Awal) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`complaint-kpi-${idx}`}
            className="p-4 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-gray-border/70 rounded" />
              <div className="h-7 w-7 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1 pt-1">
              <div className="h-6 w-12 bg-gray-border/80 rounded-lg" />
              <div className="h-2.5 w-24 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter Bar Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="h-10 w-full md:flex-1 rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="h-10 w-full md:w-56 rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="h-10 w-full md:w-48 rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="h-10 w-full md:w-28 rounded-xl bg-gray-border/50 border border-gray-border" />
      </div>

      {/* 4. Tabel Pengaduan Skeleton */}
      <div className="border border-gray-border bg-gray-card rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Tanggal & Waktu</th>
                <th className="py-4 px-5">Pelapor & Domisili</th>
                <th className="py-4 px-5">Judul & Kategori</th>
                <th className="py-4 px-5">Bukti Foto</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={4} colCount={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
