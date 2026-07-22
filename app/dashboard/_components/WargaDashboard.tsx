"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { WargaHeaderBanner } from "./warga/WargaHeaderBanner";
import { WargaQuickActions } from "./warga/WargaQuickActions";
import { WargaAnnouncementsWidget, AnnouncementItem } from "./warga/WargaAnnouncementsWidget";
import { WargaActivitiesWidget, ActivityItem } from "./warga/WargaActivitiesWidget";
import { WargaEmergencyContacts, OfficerContact } from "./warga/WargaEmergencyContacts";
import { WargaStatsWidget } from "./warga/WargaStatsWidget";

interface WargaDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  family: {
    id: number;
    familyNumber: string;
    verificationStatus: "draft" | "pending" | "verified" | "rejected";
    verificationNote?: string | null;
    headName: string;
    totalMembers: number;
  } | null;
  announcements: AnnouncementItem[];
  activities: ActivityItem[];
  finance: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  officerContacts: OfficerContact[];
  stats: {
    totalWarga: number;
    totalKK: number;
  };
}

export function WargaDashboard() {
  const [data, setData] = useState<WargaDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchWargaDashboard() {
      try {
        const res = await fetch("/api/dashboard/warga");
        if (!res.ok) {
          const errData = await res.json();
          if (isMounted) {
            setError(errData.error || "Gagal memuat data dashboard warga");
          }
          return;
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error("Fetch dashboard error:", err);
        if (isMounted) {
          setError("Terjadi kesalahan koneksi sistem.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWargaDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-gray-placeholder">Memuat Portal Warga...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md my-12 rounded-3xl border border-red-100 bg-red-50/50 p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-heading-main">Gagal Memuat Dashboard</h3>
        <p className="mt-2 text-sm text-gray-secondary-text leading-relaxed">
          {error || "Tidak dapat mengambil data dashboard Warga saat ini."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const isVerified = data?.family?.verificationStatus === "verified";

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Status KK */}
      <WargaHeaderBanner userName={data.user.name} family={data.family} />

      {/* Feature Gate Alert Banner */}
      {!isVerified && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:px-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {data.family?.verificationStatus === "pending"
                  ? "Verifikasi Berkas KK Sedang Diproses"
                  : data.family?.verificationStatus === "rejected"
                  ? "Verifikasi Berkas KK Ditolak RT"
                  : data.family?.verificationStatus === "draft"
                  ? "Draf KK Belum Dikirim Ke RT"
                  : "Berkas Kartu Keluarga Belum Dilengkapi"}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {data.family?.verificationStatus === "pending"
                  ? "Beberapa menu (Surat Pengantar & Pencarian Tetangga) saat ini terkunci. Menu akan terbuka otomatis begitu dokumen Anda disetujui Ketua RT."
                  : data.family?.verificationStatus === "rejected"
                  ? `Catatan RT: ${data.family.verificationNote || "Silakan perbaiki data & berkas KK Anda."}`
                  : data.family?.verificationStatus === "draft"
                  ? "Silakan periksa kembali data anggota keluarga Anda dan klik 'Verifikasi Ke RT' di menu Kelola KK agar Ketua RT dapat memverifikasi berkas Anda."
                  : "Silakan unggah berkas scan KK & lengkapi data keluarga Anda untuk membuka akses penuh ke seluruh layanan RT."}
              </p>
            </div>
          </div>

          <a
            href="/dashboard/family"
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-sm shrink-0 w-full sm:w-auto"
          >
            Lengkapi Data KK
          </a>
        </div>
      )}

      {/* 2. Quick Actions */}
      <WargaQuickActions isVerified={isVerified} />

      {/* 3. Stats Ringkasan */}
      <WargaStatsWidget stats={data.stats} finance={data.finance} />

      {/* 4. Grid 2 Kolom: Pengumuman & Kegiatan RT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WargaAnnouncementsWidget announcements={data.announcements} />
        <WargaActivitiesWidget activities={data.activities} />
      </div>

      {/* 5. Kontak Pengurus RT */}
      <WargaEmergencyContacts contacts={data.officerContacts} />
    </div>
  );
}
