"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { SuperAdminDashboardStats } from "./admin/types";
import { SuperAdminKpiCards } from "./admin/SuperAdminKpiCards";
import { SystemIdentityCard } from "./admin/SystemIdentityCard";
import { RoleDistributionWidget } from "./admin/RoleDistributionWidget";
import { RecentAuditLogsWidget } from "./admin/RecentAuditLogsWidget";
import { AdminQuickActionsGrid } from "./admin/AdminQuickActionsGrid";
import { SuperAdminDashboardSkeleton } from "./admin/SuperAdminDashboardSkeleton";

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/admin/stats");
      if (!res.ok) {
        throw new Error("Gagal mengambil data statistik Super Admin");
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan koneksi saat memuat data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/admin/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik Super Admin");
        }
        const data = await res.json();
        if (!isCancelled) {
          setStats(data);
          setError(null);
        }
      } catch (err: any) {
        console.error(err);
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan koneksi saat memuat data");
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
    return <SuperAdminDashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data statistik Super Admin tidak dapat ditampilkan."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={fetchStats} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Dashboard Super Admin
          </h1>
          <p className="text-sm text-gray-secondary-text mt-1">
            Panel kendali utama sistem: pemantauan statistik global, otorisasi RBAC, metadata wilayah, dan log audit keamanan.
          </p>
      </div>
      {/* 1. Global KPI Summary Cards */}
      <SuperAdminKpiCards summary={stats?.summary} />

      {/* 2. Admin Quick Actions Grid */}
      <AdminQuickActionsGrid />

      {/* 3. Identitas & Metadata Wilayah */}
      <SystemIdentityCard info={stats?.systemSettingInfo} />

      {/* 4. Distribusi Peran Pengguna (RBAC Status) */}
      <RoleDistributionWidget distribution={stats?.roleDistribution} />

      {/* 5. Audit Trail Keamanan Terkini */}
      <RecentAuditLogsWidget logs={stats?.recentAuditLogs || []} />
    </div>
  );
}
