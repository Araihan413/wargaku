import React from "react";
import Link from "next/link";
import { UserPlus, Home, QrCode } from "lucide-react";

export const CoordinatorQuickActions: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-heading-main mb-4 uppercase tracking-wider">
        Akses Cepat Pengelola
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/rentals"
          className="flex items-center gap-3 p-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover/30 hover:bg-primary/10 hover:border-primary/30 transition-all group"
        >
          <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-heading-main group-hover:text-primary transition-colors">
              Check-In Penyewa
            </div>
            <div className="text-[10px] text-gray-placeholder">Form pendaftaran penyewa baru</div>
          </div>
        </Link>

        <Link
          href="/dashboard/rentals"
          className="flex items-center gap-3 p-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover/30 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-heading-main group-hover:text-emerald-700 transition-colors">
              Kelola Unit & Kamar
            </div>
            <div className="text-[10px] text-gray-placeholder">Grid denah kamar & status huni</div>
          </div>
        </Link>

        <Link
          href="/dashboard/rentals"
          className="flex items-center gap-3 p-3.5 border border-gray-border rounded-xl bg-gray-sidebar-hover/30 hover:bg-purple-50 hover:border-purple-200 transition-all group"
        >
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-heading-main group-hover:text-purple-700 transition-colors">
              Unduh QR Code Properti
            </div>
            <div className="text-[10px] text-gray-placeholder">Berkas cetak QR fisik properti</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
