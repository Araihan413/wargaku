import React from "react";
import { Building2, Home, Users, Clock } from "lucide-react";
import { CoordinatorSummary } from "./types";

interface CoordinatorKpiCardsProps {
  summary: CoordinatorSummary;
}

export const CoordinatorKpiCards: React.FC<CoordinatorKpiCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Properti & Total Kamar */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm transition-all hover:border-primary/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-secondary-text uppercase tracking-wider">Properti Sewa</span>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-gray-heading-main">{summary.totalProperties}</div>
          <p className="mt-1 text-xs text-gray-secondary-text">
            Total Kapasitas: <span className="font-semibold text-gray-heading-main">{summary.totalRooms} Kamar</span>
          </p>
        </div>
      </div>

      {/* Kamar Terisi & Okupansi */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm transition-all hover:border-emerald-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-secondary-text uppercase tracking-wider">Terisi & Okupansi</span>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-heading-main">{summary.occupiedRooms}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {summary.occupancyRate}% Terisi
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-secondary-text">
            Total Penghuni Sewa Aktif: <span className="font-semibold text-gray-heading-main">{summary.totalActiveResidents} Warga</span>
          </p>
        </div>
      </div>

      {/* Sisa Kamar Kosong */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm transition-all hover:border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-secondary-text uppercase tracking-wider">Kamar Kosong</span>
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
            <Home className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-amber-600">{summary.vacantRooms}</div>
          <p className="mt-1 text-xs text-gray-secondary-text">
            Unit/Kamar Siap Huni Kosong
          </p>
        </div>
      </div>

      {/* Antrean Verifikasi RT */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-5 shadow-sm transition-all hover:border-purple-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-secondary-text uppercase tracking-wider">Pending RT</span>
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-extrabold text-purple-600">{summary.pendingVerifications}</div>
          <p className="mt-1 text-xs text-gray-secondary-text">
            Penyewa Menunggu Verifikasi RT
          </p>
        </div>
      </div>
    </div>
  );
};
