import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function DuesManageSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat kelola iuran warga">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Fee Rules Section Skeleton (Layar Awal) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-border/80" />
          <div className="h-4 w-36 bg-gray-border/80 rounded" />
        </div>

        {/* Placeholder Kartu Aturan Iuran */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-border/80 rounded" />
            <div className="h-7 w-32 bg-gray-border/80 rounded-lg" />
            <div className="h-4 w-20 bg-gray-border/60 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-gray-border/70 rounded-xl" />
            <div className="h-9 w-9 bg-gray-border/70 rounded-xl" />
            <div className="h-9 w-9 bg-gray-border/70 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 3. Payment Matrix Summary & Table Skeleton */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-4 w-48 bg-gray-border/80 rounded" />
            <div className="h-3 w-32 bg-gray-border/50 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-border/70 rounded-xl" />
            <div className="h-9 w-36 bg-gray-border/70 rounded-xl" />
          </div>
        </div>

        {/* 4 Mini KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`dues-stat-${idx}`} className="p-3.5 rounded-xl border border-gray-border bg-gray-sidebar-hover/30 space-y-1.5">
              <div className="h-3 w-16 bg-gray-border/60 rounded" />
              <div className="h-6 w-12 bg-gray-border/80 rounded" />
            </div>
          ))}
        </div>

        {/* Tabel Ringkasan Matrix */}
        <div className="overflow-x-auto border border-gray-border rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama KK & Alamat</th>
                <th className="py-3 px-4">Nomor KK</th>
                <th className="py-3 px-4">Status Tagihan</th>
                <th className="py-3 px-4">Terbayar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={4} colCount={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
