"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const segmentMap: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Pengguna",
  permissions: "Peran & Izin",
  "audit-logs": "Log Audit",
  residents: "Kependudukan",
  "kas-report": "Laporan Kas",
  "complaints-report": "Laporan Pengaduan",
  "system-config": "Konfigurasi Sistem",
  "smart-groups": "Smart Group",
  "qr-codes": "Cetak QR Code",
  approvals: "Persetujuan",
  registration: "Registrasi",
  documents: "Berkas KK/KTP",
  kas: "Keuangan Kas",
  surat: "Surat Pengantar",
  archive: "Arsip",
  transactions: "Transaksi",
  iuran: "Iuran Warga",
  announcements: "Pengumuman",
  activities: "Kegiatan",
  complaints: "Pengaduan Warga",
  income: "Pemasukan",
  expense: "Pengeluaran",
  manage: "Kelola",
  tunggakan: "Tunggakan",
  rentals: "Properti Sewa",
  family: "Anggota Keluarga",
  warga: "Warga",
  notifications: "Notifikasi",
  "rental-residents": "Penyewa",
  "check-out": "Check Out",
};

const getSegmentLabel = (segment: string): string => {
  if (segmentMap[segment]) return segmentMap[segment];
  // Check if it's an ID
  if (/^[0-9]+$/.test(segment) || segment.length > 20) {
    return "Detail";
  }
  // Fallback: title case and replace hyphens with spaces
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  
  if (pathSegments.length <= 1) return null; // Don't show if we are only on /dashboard (represented by Home)

  return (
    <nav 
      className="flex items-center text-xs font-medium text-gray-secondary-text overflow-x-auto whitespace-nowrap py-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden -mx-2 px-2" 
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
        </li>
        
        {pathSegments.map((segment, index) => {
          // Skip "dashboard" as it's represented by "Beranda" (Home icon)
          if (segment === "dashboard") return null;

          const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = getSegmentLabel(segment);

          return (
            <li key={url} className="inline-flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-gray-placeholder mx-0.5" />
              {isLast ? (
                <span 
                  className="font-bold text-gray-heading-main truncate max-w-30 sm:max-w-50" 
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={url}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
