import React from "react";
import { Users, Home, UserCheck, Building } from "lucide-react";
import { DashboardStats } from "../../types";

interface KpiCardsProps {
  summary: DashboardStats["summary"];
}

export function KpiCards({ summary }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Rumah */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Total Rumah</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalRumah ?? 0}
            </h3>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 transition-all group-hover:scale-110">
              <Home className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Data rumah terdaftar
        </p>
      </div>

      {/* 2. Total Penduduk */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Total Penduduk</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalWargaAktif}
            </h3>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-all group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Warga terdaftar
        </p>
      </div>

      {/* 3. Kepala Keluarga */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Kepala Keluarga</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalKK}
            </h3>
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600 transition-all group-hover:scale-110">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Total KK
        </p>
      </div>

      {/* 4. Anak Kos */}
      <div className="group relative overflow-hidden rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="w-full">
          <p className="text-sm font-semibold tracking-wider text-gray-secondary-text">Anak Kos</p>
          <div className="flex justify-between items-center mt-2">
            <h3 className="mt-2 text-3xl font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
              {summary.totalPendatang}
            </h3>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600 transition-all group-hover:scale-110">
              <Building className="h-6 w-6" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-secondary-text">
          Penyewa kos aktif
        </p>
      </div>
    </div>
  );
}
