"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { PublicPortalData } from "@/app/_components/types";
import { PublicHeaderNavbar } from "@/app/_components/PublicHeaderNavbar";
import { PublicHeroSection } from "@/app/_components/PublicHeroSection";
import { PublicAnnouncementsSection } from "@/app/_components/PublicAnnouncementsSection";
import { PublicActivitiesSection } from "@/app/_components/PublicActivitiesSection";
import { PublicDemographicsSection } from "@/app/_components/PublicDemographicsSection";
import { PublicFinanceAndEmergencySection } from "@/app/_components/PublicFinanceAndEmergencySection";
import { PublicLocationAndAboutSection } from "@/app/_components/PublicLocationAndAboutSection";
import { PublicContactFooter } from "@/app/_components/PublicContactFooter";

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
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-bounce" />
        <p className="text-xs font-bold text-slate-300">Memuat Portal Utama Wargaku...</p>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center max-w-md w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-lg">
          <AlertTriangle className="h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Terjadi Kesalahan</h3>
          <p className="mt-2 text-xs text-slate-600">
            {error || "Portal utama RT tidak dapat dimuat saat ini."}
          </p>
          <div className="mt-6">
            <RefreshButton onClick={loadData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Header Navbar */}
      <PublicHeaderNavbar settings={data.settings} />

      {/* 2. Hero Section */}
      <PublicHeroSection settings={data.settings} />

      {/* 3. Pengumuman Terbaru */}
      <PublicAnnouncementsSection announcements={data.announcements} />

      {/* 4. Jadwal Terbaru (Agenda Kegiatan) */}
      <PublicActivitiesSection activities={data.activities} />

      {/* 5. Statistik Kependudukan & Visualisasi Grafik */}
      <PublicDemographicsSection demographics={data.demographics} />

      {/* 6. Transparansi Kas & Kontak Darurat */}
      <PublicFinanceAndEmergencySection
        finance={data.financeSummary}
        emergencyContacts={data.emergencyContacts}
      />

      {/* 7. Lokasi Kantor RT & Tentang WargaKu */}
      <PublicLocationAndAboutSection settings={data.settings} />

      {/* 8. Footer */}
      <PublicContactFooter settings={data.settings} />
    </div>
  );
}
