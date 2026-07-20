import React from "react";
import { Users, Home, ShieldAlert, UserCheck } from "lucide-react";
import { DashboardStats } from "../../types";

interface KpiCardsProps {
  summary: DashboardStats["summary"];
}

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Warga Aktif */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
            <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Total Warga Aktif</p>
            <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalWargaAktif}
            </h3>
            <div className="rounded-xl bg-primary-100 p-3 text-primary transition-all group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
            </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Gabungan warga tetap & pendatang aktif
        </p>
      </div>

      {/* Total Kepala Keluarga */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Kepala Keluarga (KK)</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalKK}
            </h3>
            <div className="rounded-xl bg-secondary-100 p-3 text-secondary transition-all group-hover:scale-110">
              <Home className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          KK terdaftar aktif terverifikasi
        </p>
      </div>

      {/* Warga Tetap */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Warga Tetap</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalWargaTetap}
            </h3>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 transition-all group-hover:scale-110">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Terdata sesuai KK wilayah RT setempat
        </p>
      </div>

      {/* Pendatang */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Penyewa (Pendatang)</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalPendatang}
            </h3>
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600 transition-all group-hover:scale-110">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Penyewa kos/kontrakan aktif
        </p>
      </div>
    </div>
  );
}
