"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { TreasurerDashboardStats } from "./treasurer/types";
import { TreasurerKpiCards } from "./treasurer/TreasurerKpiCards";
import { CashflowOverviewCard } from "./treasurer/CashflowOverviewCard";
import { RecentTransactionsWidget } from "./treasurer/RecentTransactionsWidget";

export function BendaharaDashboard() {
  const [stats, setStats] = useState<TreasurerDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/treasurer/stats");
      if (!res.ok) {
        throw new Error("Gagal mengambil data statistik keuangan Bendahara");
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

    async function loadInitialData() {
      try {
        const res = await fetch("/api/dashboard/treasurer/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik keuangan Bendahara");
        }
        const data = await res.json();
        if (!isCancelled) {
          setStats(data);
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

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-border/60 rounded-xl" />
          <div className="h-4 w-96 bg-gray-border/40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-card border border-gray-border rounded-2xl p-4" />
          ))}
        </div>
        <div className="h-64 bg-gray-card border border-gray-border rounded-2xl" />
        <div className="h-80 bg-gray-card border border-gray-border rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data statistik keuangan tidak dapat ditampilkan."}
        </p>
        <button
          type="button"
          onClick={fetchStats}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-900 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Muat Ulang Halaman</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
                Dashboard Keuangan RT
              </h1>
              <p className="text-sm text-gray-secondary-text mt-0.5">
                Ringkasan Saldo Kas RT, perbandingan arus kas bulan ini, dan rekapitulasi iuran warga.
              </p>
            </div>
          </div>
      </div>

      {/* 1. KPI Cards */}
      <TreasurerKpiCards stats={stats} />

      {/* 2. Cashflow Overview Card */}
      <CashflowOverviewCard stats={stats} />

      {/* 3. Recent Transactions Table */}
      <RecentTransactionsWidget transactions={stats.recentTransactions} />
    </div>
  );
}
