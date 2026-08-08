"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, QrCode, Home, Download } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { WargaHeaderBanner } from "./warga/WargaHeaderBanner";
import { WargaQuickActions } from "./warga/WargaQuickActions";
import { WargaAnnouncementsWidget, AnnouncementItem } from "./warga/WargaAnnouncementsWidget";
import { WargaActivitiesWidget, ActivityItem } from "./warga/WargaActivitiesWidget";
import { WargaEmergencyContacts, OfficerContact } from "./warga/WargaEmergencyContacts";
import { WargaStatsWidget } from "./warga/WargaStatsWidget";
import { WargaFeeWidget } from "./warga/WargaFeeWidget";

interface WargaDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  dwelling: {
    id: number;
    blockNumber: string;
    houseNumber: string;
    qrToken: string;
    type: "permanen" | "kos" | "homestay";
    latitude?: string | null;
    longitude?: string | null;
  } | null;
  family: {
    id: number;
    familyNumber: string;
    verificationStatus: "draft" | "pending" | "verified" | "rejected" | "changes_pending";
    verificationNote?: string | null;
    headName: string;
    hasVerified: boolean;
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

  const isVerified = Boolean(
    data?.family?.hasVerified ||
    data?.family?.verificationStatus === "verified" ||
    data?.family?.verificationStatus === "changes_pending"
  );

  const downloadQRCode = async (token: string, block: string, houseNum: string) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://wargaku.app";
      const qrUrl = `${origin}/scan-qr?token=${encodeURIComponent(token)}`;
      const url = await QRCode.toDataURL(qrUrl, { width: 400, margin: 2 });
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR_Rumah_Blok_${block}_No_${houseNum}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code Rumah berhasil diunduh");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh QR Code");
    }
  };

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

      {/* 2.2 Status Iuran Warga */}
      {isVerified && <WargaFeeWidget />}

      {/* 2.5 Detail Rumah Tinggal */}
      {isVerified && data.dwelling && (
        <div className="rounded-3xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-3 duration-250">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Home className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold tracking-wider text-primary font-sans">Detail Rumah Tinggal Anda</span>
              <h3 className="text-lg font-bold text-gray-heading-main">
                Blok {data.dwelling.blockNumber} No. {data.dwelling.houseNumber}
              </h3>
              <p className="text-xs text-gray-secondary-text">
                Tipe Hunian: <span className="font-semibold capitalize">{data.dwelling.type}</span>
                {data.dwelling.latitude && data.dwelling.longitude && (
                  <span className="ml-2 font-mono text-[10px] text-gray-placeholder">
                    ({data.dwelling.latitude}, {data.dwelling.longitude})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => downloadQRCode(data.dwelling!.qrToken, data.dwelling!.blockNumber, data.dwelling!.houseNumber)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-sm w-full md:w-auto cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Unduh QR Code Rumah</span>
              <Download className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      )}

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
