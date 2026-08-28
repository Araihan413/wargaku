import React from "react";
import { TableSkeleton } from "@/components/TableSkeleton";

export function RegistrationApprovalsSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse" aria-busy="true" aria-label="Memuat persetujuan registrasi warga">
      {/* 1. Header Halaman Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 sm:h-9 w-56 sm:w-72 max-w-full bg-gray-border/80 rounded-xl" />
          <div className="h-4 w-full max-w-xl bg-gray-border/50 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-gray-border/70 rounded-xl shrink-0 self-start sm:self-auto" />
      </div>

      {/* 2. Main Content Card Skeleton */}
      <div className="bg-gray-card border border-gray-border rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-border/80 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-44 max-w-full bg-gray-border/80 rounded" />
              <div className="h-3 w-56 max-w-full bg-gray-border/50 rounded" />
            </div>
          </div>
          <div className="h-7 w-32 bg-gray-border/70 rounded-lg shrink-0 self-start sm:self-auto" />
        </div>

        {/* Tabel Antrean Skeleton */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
              <tr>
                <th className="py-4 px-5">Nama & Kontak</th>
                <th className="py-4 px-5">Tipe Akun</th>
                <th className="py-4 px-5">NIK</th>
                <th className="py-4 px-5">Nomor KK</th>
                <th className="py-4 px-5">Rencana Alamat</th>
                <th className="py-4 px-5 text-center">Tanggal Daftar</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border text-sm text-gray-heading-main">
              <TableSkeleton rowCount={3} colCount={7} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
