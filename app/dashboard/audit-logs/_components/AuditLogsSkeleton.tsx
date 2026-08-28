import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function AuditLogsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat log aktivitas audit">
      {/* 1. Welcome Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-56 sm:w-96 max-w-full bg-gray-border/80 rounded-xl" />
        <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
      </div>

      {/* 2. 4 Kartu KPI Summary (Layar Awal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={`audit-kpi-${idx}`}
            className="p-5 rounded-2xl border border-gray-border bg-gray-card shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-gray-border/70 rounded" />
              <div className="h-8 w-8 rounded-xl bg-gray-border/80" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-7 w-20 bg-gray-border/80 rounded-lg" />
              <div className="h-3 w-36 bg-gray-border/50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Filter Bar Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-3xl">
          <div className="h-10 w-full sm:w-72 rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="h-10 w-full sm:w-48 rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="h-10 w-full sm:w-48 rounded-xl bg-gray-border/50 border border-gray-border" />
        </div>
        <div className="h-10 w-32 bg-gray-border/70 rounded-xl shrink-0 self-start md:self-auto" />
      </div>

      {/* 4. Tabel Audit Log Skeleton */}
      <div className="border border-gray-border rounded-2xl bg-gray-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Waktu & Pengguna</th>
                <th className="py-4 px-5">Modul & Aksi</th>
                <th className="py-4 px-5">Ringkasan Aktivitas</th>
                <th className="py-4 px-5">IP & Perangkat</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={5} colCount={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
