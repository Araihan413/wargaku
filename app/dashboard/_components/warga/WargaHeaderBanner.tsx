"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, UserCheck, FileText } from "lucide-react";

interface WargaHeaderBannerProps {
  userName: string;
  family: {
    id: number;
    familyNumber: string;
    verificationStatus: "draft" | "pending" | "verified" | "rejected";
    verificationNote?: string | null;
    headName: string;
    totalMembers: number;
  } | null;
}

export function WargaHeaderBanner({ userName, family }: WargaHeaderBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 sm:p-8 text-white shadow-md">

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Greeting & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Portal Warga RT Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Selamat Datang, {userName}!
          </h1>
          <p className="text-sm sm:text-base text-primary-100 max-w-xl leading-relaxed">
            Akses informasi lingkungan, transparansi keuangan kas RT, layanan pengaduan warga, dan pengajuan surat pengantar mandiri dalam satu portal.
          </p>
        </div>

        {/* KK Status Badge / Alert Box */}
        <div className="shrink-0 w-full lg:w-auto">
          {family ? (
            family.verificationStatus === "verified" ? (
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:px-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Kartu Keluarga
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    No. KK: {family.familyNumber}
                  </p>
                  <p className="text-xs text-primary-200">
                    {family.totalMembers} Anggota Terdaftar
                  </p>
                </div>
              </div>
            ) : family.verificationStatus === "pending" ? (
              <div className="flex items-center gap-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 p-4 sm:px-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/30 text-amber-200">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                      Verifikasi KK
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                      Menunggu RT
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mt-0.5">
                    Data KK Anda sedang ditinjau oleh RT.
                  </p>
                </div>
              </div>
            ) : family.verificationStatus === "draft" ? (
              <div className="flex items-center gap-4 rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 p-4 sm:px-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/30 text-blue-200">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Draf KK
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/30 px-2 py-0.5 text-[10px] font-bold text-blue-100">
                      Belum Dikirim
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mt-0.5">
                    Data KK belum diajukan ke RT.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-400/30 p-4 sm:px-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/30 text-red-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                      Verifikasi Ditolak
                    </span>
                  </div>
                  <p className="text-xs text-red-100 mt-0.5 max-w-xs line-clamp-2">
                    {family.verificationNote || "Silakan perbaiki data KK Anda."}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:px-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">KK Belum Lengkap</h4>
                <p className="text-xs text-primary-200">
                  Lengkapi data anggota keluarga & upload KK Anda.
                </p>
              </div>
              <Link
                href="/dashboard/family"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary-50 transition-colors shadow-sm shrink-0"
              >
                <span>Kelola KK</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
