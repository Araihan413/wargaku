import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function SystemBroadcastSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-pulse" aria-busy="true" aria-label="Memuat manajemen broadcast sistem">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-48 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Filter & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-card p-4 rounded-2xl border border-gray-border/60 shadow-xs">
        <div className="h-9 w-full sm:w-80 rounded-xl bg-gray-border/50 border border-gray-border" />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`broadcast-tab-${idx}`} className="h-7 w-20 bg-gray-border/60 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* 3. Data Table Skeleton */}
      <div className="bg-gray-card rounded-2xl border border-gray-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border/80 bg-gray-sidebar-hover/80 text-[11px] font-bold text-gray-heading-small">
              <tr>
                <th className="py-3.5 px-4">Broadcast & Tipe</th>
                <th className="py-3.5 px-4">Periode Aktif</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Dibuat Oleh</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-xs text-gray-heading-main">
              <TableSkeleton rowCount={5} colCount={5} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
