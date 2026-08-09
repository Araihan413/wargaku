"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardStats } from "../types";
import { DashboardSkeleton } from "./rt/DashboardSkeleton";
import { KpiCards } from "./rt/KpiCards";
import { DemographySection } from "./rt/DemographySection";
import { SocialSection } from "./rt/SocialSection";
import { MutationSection } from "./rt/MutationSection";
import { FinanceSection } from "./rt/FinanceSection";
import { PropertySection } from "./rt/PropertySection";
import { ComplaintSection } from "./rt/ComplaintSection";

export function KetuaRTDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/rt/stats");
        if (!res.ok) {
          throw new Error("Gagal mengambil data statistik");
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
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">{error || "Data statistik tidak dapat ditampilkan."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-900"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const {
    summary,
    genderDistribution,
    ageDistribution,
    occupationDistribution,
    educationDistribution,
    religionDistribution,
    dwellingDistribution,
    occupancyRate,
    cashSummary,
    cashflowTrend,
    complaintSummary,
    topComplaintCategories,
    populationMutations,
  } = stats;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
          Dashboard Ketua RT
        </h1>
        <p className="text-sm text-gray-secondary-text mt-1">
          Pantau demografi warga, kas keuangan, okupansi hunian, dan laporan pengaduan secara terpusat.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards summary={summary} />

      {/* Row 1: Mutasi Penduduk — bagian Statistik Utama Kependudukan (PRD A) */}
      <MutationSection populationMutations={populationMutations} />

      {/* Row 2: Demografi Utama (Gender & Usia) */}
      <DemographySection
        genderDistribution={genderDistribution}
        ageDistribution={ageDistribution}
        totalWargaAktif={summary.totalWargaAktif}
      />

      {/* Row 3: Sosial (Pekerjaan & Agama & Pendidikan) */}
      <SocialSection
        religionDistribution={religionDistribution}
        educationDistribution={educationDistribution}
        occupationDistribution={occupationDistribution}
        totalWargaAktif={summary.totalWargaAktif}
      />

      {/* Row 4: Keuangan & Properti Hunian */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tren Keuangan Cashflow */}
        <FinanceSection cashSummary={cashSummary} cashflowTrend={cashflowTrend} />

        {/* Hunian & Properti Okupansi */}
        <PropertySection dwellingDistribution={dwellingDistribution} occupancyRate={occupancyRate} />
      </div>

      {/* Row 5: Pengaduan / Laporan Warga */}
      <ComplaintSection
        complaintSummary={complaintSummary}
        topComplaintCategories={topComplaintCategories}
      />
    </div>
  );
}
