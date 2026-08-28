"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { SecretaryDashboardStats } from "./secretary/types";
import { SecretaryKpiCards } from "./secretary/SecretaryKpiCards";
import { PendingRegistrationQueue } from "./secretary/PendingRegistrationQueue";
import { UpcomingActivitiesWidget } from "./secretary/UpcomingActivitiesWidget";
import { LatestAnnouncementsWidget } from "./secretary/LatestAnnouncementsWidget";
import { RecentComplaintsWidget } from "./secretary/RecentComplaintsWidget";
import { SecretaryDashboardSkeleton } from "./secretary/SecretaryDashboardSkeleton";

export function SekretarisDashboard() {
  const [stats, setStats] = useState<SecretaryDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/secretary/stats");
      if (!res.ok) {
        throw new Error("Gagal mengambil data statistik sekretaris");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/secretary/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik sekretaris");
        }
        const data = await res.json();
        if (!isCancelled) {
          setStats(data);
        }
      } catch (err: any) {
        console.error(err);
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan koneksi");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading && !stats) {
    return <SecretaryDashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">{error || "Data statistik tidak dapat ditampilkan."}</p>
        <button
          type="button"
          onClick={fetchStats}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-900 cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const summary = stats?.summary || { pendingRegistrations: 0, newComplaints: 0, upcomingActivities: 0 };
  const pendingRegistrations = stats?.pendingRegistrations || [];
  const upcomingActivities = stats?.upcomingActivities || [];
  const latestAnnouncements = stats?.latestAnnouncements || [];
  const recentComplaints = stats?.recentComplaints || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
          Dashboard Sekretaris RT
        </h1>
        <p className="text-sm text-gray-secondary-text mt-1">
          Pusat administrasi operasional: verifikasi pendaftaran warga, kelola pengumuman, dan agenda kegiatan RT.
        </p>
      </div>

      {/* KPI Cards Summary */}
      <SecretaryKpiCards summary={summary} />

      {/* Section 1: Persetujuan Akun Warga Mandiri */}
      <div>
        <PendingRegistrationQueue registrations={pendingRegistrations} onRefresh={fetchStats} />
      </div>

      {/* Section 2: Agenda Kegiatan RT & Pengumuman Warga RT (Bersebelahan di laptop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingActivitiesWidget activities={upcomingActivities} />
        <LatestAnnouncementsWidget announcements={latestAnnouncements} />
      </div>

      {/* Section 3: Pengaduan Laporan Warga (Di bawahnya sendiri) */}
      <div>
        <RecentComplaintsWidget complaints={recentComplaints} onRefresh={fetchStats} />
      </div>
    </div>
  );
}
