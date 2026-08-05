"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";

interface WargaHeaderBannerProps {
  userName: string;
  family: {
    id: number;
    familyNumber: string;
    verificationStatus: "draft" | "pending" | "verified" | "rejected" | "changes_pending";
    verificationNote?: string | null;
    headName: string;
    totalMembers: number;
  } | null;
}

export function WargaHeaderBanner({ userName, family }: WargaHeaderBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary p-6 sm:p-8 text-white shadow-md">

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
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
        {family?.verificationStatus === "verified" && (
          <div className="shrink-0 w-full lg:w-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}
