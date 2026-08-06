"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle} from "lucide-react";
import { CoordinatorDashboardStats } from "./coordinator/types";
import { CoordinatorKpiCards } from "./coordinator/CoordinatorKpiCards";
import { PropertyOccupancySection } from "./coordinator/PropertyOccupancySection";
import { PendingVerificationQueue } from "./coordinator/PendingVerificationQueue";
import { CoordinatorQuickActions } from "./coordinator/CoordinatorQuickActions";

export function KoordinatorKosDashboard() {
  const [stats, setStats] = useState<CoordinatorDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/coordinator/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik operasional");
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan koneksi");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-8 w-64 bg-gray-border/60 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-card border border-gray-border rounded-2xl p-5" />
          ))}
        </div>
        <div className="h-64 bg-gray-card border border-gray-border rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">{error || "Data statistik operasional kos tidak dapat ditampilkan."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-900 cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const { summary, propertyBreakdown, pendingQueue } = stats;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
            <span>Dashboard Pengelola Properti Sewa</span>
          </h1>
          <p className="text-xs text-gray-secondary-text mt-1">
            Pantau keterisian kamar kos/kontrakan, sisa unit kosong, dan antrean verifikasi dokumen penyewa.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary shrink-0 self-start sm:self-auto">
          <span>{summary.totalProperties} Properti Sewa Dikelola</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <CoordinatorQuickActions />

      {/* KPI Cards Summary */}
      <CoordinatorKpiCards summary={summary} />

      {/* Property Occupancy Breakdown */}
      <PropertyOccupancySection properties={propertyBreakdown} />

      {/* Pending Verification Queue Table */}
      <PendingVerificationQueue pendingList={pendingQueue} />
    </div>
  );
}
