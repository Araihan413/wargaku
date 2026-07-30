"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Building,
  Building2,
  MapPin,
  MessageSquare,
  AlertCircle,
  Navigation,
  User,
  BedDouble,
  Users,
  LayoutDashboard,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { PublicScanResultData, DetailedScanResultData, ActiveResidentEntry } from "@/db/queries/public-portal";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Props ─────────────

interface ScanResultCardPublicProps {
  mode: "publik";
  scanResult: PublicScanResultData;
  detailData?: never;
  loggedInUserName?: never;
}

interface ScanResultCardLoginProps {
  mode: "warga-login";
  scanResult: PublicScanResultData;
  detailData: DetailedScanResultData;
  loggedInUserName?: string;
}

type ScanResultCardProps = ScanResultCardPublicProps | ScanResultCardLoginProps;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTypeBadge = (type: PublicScanResultData["type"]) => {
  switch (type) {
    case "permanen":
      return {
        label: "Rumah Tinggal Pribadi",
        bg: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Home,
      };
    case "kos":
      return {
        label: "Kos-kosan / Kontrakan",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: Building,
      };
    case "homestay":
      return {
        label: "Homestay (Sewa Harian)",
        bg: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Building2,
      };
    default:
      return {
        label: "Hunian",
        bg: "bg-slate-100 text-slate-800 border-slate-200",
        icon: Home,
      };
  }
};

function formatCheckIn(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "MMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}

// ─── Sub-komponen: Daftar Penghuni Aktif (mode warga-login) ─────────────────

function ActiveResidentsList({ residents }: { residents: ActiveResidentEntry[] }) {
  if (residents.length === 0) {
    return (
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-amber-700 text-xs font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Belum ada data penghuni aktif terdaftar.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {residents.map((r, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${
            r.type === "keluarga"
              ? "bg-blue-50/60 border-blue-200/80"
              : "bg-emerald-50/60 border-emerald-200/80"
          }`}
        >
          <div className={`p-1.5 rounded-lg ${r.type === "keluarga" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
            {r.type === "keluarga" ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-xs leading-snug truncate">{r.name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {r.type === "keluarga" && r.memberCount !== undefined && (
                <span className="text-[11px] text-blue-700 font-semibold">{r.memberCount} anggota keluarga</span>
              )}
              {r.type === "keluarga" && r.unitNumber && (
                <span className="text-[11px] text-slate-500 font-medium">Unit {r.unitNumber}</span>
              )}
              {r.type === "penyewa" && r.roomNumber && (
                <span className="text-[11px] text-emerald-700 font-semibold">Kamar {r.roomNumber}</span>
              )}
              {r.checkInDate && (
                <span className="text-[11px] text-slate-400 font-medium">Sejak {formatCheckIn(r.checkInDate)}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ mode, scanResult, detailData, loggedInUserName }) => {
  const badge = getTypeBadge(scanResult.type);
  const IconComp = badge.icon;

  // Data yang dipakai: mode warga-login pakai detailData, mode publik pakai scanResult
  const displayData = mode === "warga-login" && detailData ? detailData : scanResult;
  const ownerName = displayData.ownerName;
  const ownerPhone = displayData.ownerPhone;
  const propertyName = displayData.propertyName;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-300">

      {/* Banner untuk mode warga-login */}
      {mode === "warga-login" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs font-semibold text-blue-800">
            {loggedInUserName ? `Anda login sebagai ${loggedInUserName}.` : "Anda sedang login."}{" "}
            Informasi yang ditampilkan lebih lengkap dari tampilan publik.
          </p>
        </div>
      )}

      {/* Header: Address & Type Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Profil Hunian Warga • {scanResult.rtName} / {scanResult.rwName}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Blok {scanResult.blockNumber} No. {scanResult.houseNumber}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {scanResult.villageName}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${badge.bg}`}
        >
          <IconComp className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </span>
      </div>

      {/* CONDITIONAL DETAILS PER DWELLING TYPE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. RUMAH TINGGAL PRIBADI (permanen) */}
        {scanResult.type === "permanen" && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <User className="w-4 h-4 text-blue-600" />
              <span>Pemilik / Kepala Keluarga</span>
            </div>
            <p className="text-base font-extrabold text-slate-900">
              {ownerName || "Data Pemilik Belum Terdaftar"}
            </p>
          </div>
        )}

        {/* 2. KOS-KOSAN / KONTRAKAN (kos) */}
        {scanResult.type === "kos" && (
          <>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Properti Kos
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                {propertyName || `Kos Blok ${scanResult.blockNumber}`}
              </h4>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <BedDouble className="w-4 h-4 text-emerald-600" />
                <span>Ketersediaan Kamar Kosong</span>
              </div>
              <p className="text-xl font-black text-emerald-700 tracking-tight">
                {displayData.availableRooms !== null
                  ? `${displayData.availableRooms} Kamar Tersedia`
                  : "Kamar Tersedia"}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                Terisi {displayData.occupiedRooms} dari total {displayData.totalRooms || 0} kamar
              </p>
            </div>

            {ownerName && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 md:col-span-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pengelola Kos
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {ownerName}
                    </p>
                  </div>
                  {ownerPhone && (
                    <a
                      href={`https://wa.me/${ownerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Halo ${ownerName}, saya ingin bertanya mengenai sewa kamar kos di ${propertyName || "Blok " + scanResult.blockNumber}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Hubungi via WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 3. HOMESTAY — tanpa sisa kamar */}
        {scanResult.type === "homestay" && (
          <>
            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-5 space-y-2 md:col-span-2">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                Nama Homestay (Sewa Harian)
              </span>
              <h4 className="text-lg font-black text-purple-950">
                {propertyName || `Homestay Blok ${scanResult.blockNumber}`}
              </h4>
            </div>

            {ownerName && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 md:col-span-2 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pengelola Homestay
                    </span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {ownerName}
                    </p>
                  </div>
                  {ownerPhone && (
                    <a
                      href={`https://wa.me/${ownerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Halo ${ownerName}, saya ingin melakukan reservasi Homestay ${propertyName || "Blok " + scanResult.blockNumber}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Reservasi Homestay (WhatsApp)</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DAFTAR PENGHUNI AKTIF (hanya mode warga-login) */}
      {mode === "warga-login" && detailData && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Daftar Penghuni Aktif</span>
          </div>
          <ActiveResidentsList residents={detailData.activeResidents} />
        </div>
      )}

      {/* PETA LOKASI GPS */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Peta Lokasi GPS Hunian</span>
          </span>
        </div>

        {scanResult.latitude && scanResult.longitude ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-900">
                Koordinat GPS Terdaftar
              </span>
              <p className="text-xs font-mono text-slate-500">
                Lat: {scanResult.latitude}, Long: {scanResult.longitude}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${scanResult.latitude},${scanResult.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>📍 Petunjuk Rute Google Maps</span>
            </a>
          </div>
        ) : (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Lokasi GPS koordinat belum di-set / tidak tersedia untuk hunian ini.</span>
          </div>
        )}
      </div>

      {/* TOMBOL NAVIGASI (hanya mode warga-login) */}
      {mode === "warga-login" && (
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ke Dashboard Saya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      )}
    </div>
  );
};
