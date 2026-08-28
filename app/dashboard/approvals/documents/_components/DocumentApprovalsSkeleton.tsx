import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function DocumentApprovalsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse overflow-hidden" aria-busy="true" aria-label="Memuat verifikasi kependudukan">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-80 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Tabs & Controls Toolbar Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs overflow-hidden">
        {/* Row 1: Tab Navigation */}
        <div className="flex items-center justify-between border-b border-gray-border/60 pb-3">
          <div className="flex bg-gray-sidebar-hover/60 p-1 rounded-xl gap-1">
            <div className="h-8 w-28 bg-gray-border/80 rounded-lg" />
            <div className="h-8 w-28 bg-gray-border/50 rounded-lg" />
          </div>
        </div>

        {/* Row 2: Search & Filters Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
          <div className="h-10 w-full lg:max-w-md rounded-xl bg-gray-border/50 border border-gray-border" />
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <div className="h-10 w-full sm:w-52 rounded-xl bg-gray-border/50 border border-gray-border" />
            <div className="h-10 w-full sm:w-44 rounded-xl bg-gray-border/50 border border-gray-border" />
          </div>
        </div>
      </div>

      {/* 3. Data Table Skeleton */}
      <div className="border border-gray-border bg-gray-card rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Nomor KK & Kepala Keluarga</th>
                <th className="py-4 px-5">Jenis Pengajuan</th>
                <th className="py-4 px-5">Alamat & Hunian</th>
                <th className="py-4 px-5">Dokumen KK</th>
                <th className="py-4 px-5 text-center">Status</th>
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
