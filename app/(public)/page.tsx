"use client";

import React, { useState, useEffect } from "react";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { PublicPortalData } from "@/app/_components/types";
import { PublicHeroSection } from "@/app/_components/PublicHeroSection";
import { PublicAnnouncementsSection } from "@/app/_components/PublicAnnouncementsSection";
import { PublicActivitiesSection } from "@/app/_components/PublicActivitiesSection";
import { PublicDemographicsSection } from "@/app/_components/PublicDemographicsSection";
import { PublicFinanceAndEmergencySection } from "@/app/_components/PublicFinanceAndEmergencySection";
import { PublicLocationAndAboutSection } from "@/app/_components/PublicLocationAndAboutSection";

export default function Home() {
  const [data, setData] = useState<PublicPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/public/portal");
        if (!res.ok) throw new Error("Gagal memuat data portal publik RT");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan koneksi");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      try {
        const res = await fetch("/api/public/portal");
        if (!res.ok) throw new Error("Gagal memuat data portal publik RT");
        const json = await res.json();
        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) setError(err.message || "Terjadi kesalahan koneksi");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="bg-slate-50 text-slate-900 animate-pulse py-12 px-4 sm:px-6 space-y-8 max-w-[1920px] mx-auto">
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !data) {
    return (
      <PublicErrorState
        title="Gagal Memuat Portal Utama"
        message={error || "Portal utama RT tidak dapat dimuat saat ini. Silakan coba lagi."}
        onRetry={loadData}
        isLoading={isLoading}
      />
    );
  }

  return (
    <>
    <div className="max-w-[1920px] mx-auto">
      {/* 1. Hero Section */}
      <PublicHeroSection settings={data.settings} />

      {/* 2. Pengumuman Terbaru */}
      <PublicAnnouncementsSection announcements={data.announcements} />

      {/* 3. Jadwal Terbaru (Agenda Kegiatan) */}
      <PublicActivitiesSection activities={data.activities} />

      {/* 4. Statistik Kependudukan & Visualisasi Grafik */}
      <PublicDemographicsSection demographics={data.demographics} />

      {/* 5. Transparansi Kas & Kontak Darurat */}
      <PublicFinanceAndEmergencySection
        finance={data.financeSummary}
        emergencyContacts={data.emergencyContacts}
      />

      {/* 6. Lokasi Kantor RT & Tentang WargaKu */}
      <PublicLocationAndAboutSection settings={data.settings} />
      </div>
    </>
  );
}
