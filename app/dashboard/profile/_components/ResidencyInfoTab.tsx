"use client";

import React from "react";
import { IdCard, Home, FileText, ShieldCheck, Info } from "lucide-react";
import { UserProfileData } from "../types";

interface ResidencyInfoTabProps {
  profile: UserProfileData;
}

export const ResidencyInfoTab: React.FC<ResidencyInfoTabProps> = ({ profile }) => {
  return (
    <div className="bg-white border border-gray-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight">
          Informasi Kependudukan & Hunian Resmi
        </h2>
        <p className="text-xs text-gray-secondary-text mt-0.5">
          Data kependudukan resmi yang terikat dengan Sistem Informasi RT/RW Wargaku.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Demi validitas data kependudukan RT, perubahan <strong>NIK</strong> atau <strong>Data Hunian</strong> dilakukan melalui pengurus RT/Sekretaris.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIK Card */}
        <div className="p-4 border border-gray-border rounded-xl bg-gray-card flex items-start gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <IdCard className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-gray-secondary-text">Nomor Induk Kependudukan (NIK)</span>
            <p className="text-sm font-bold text-gray-heading-main font-mono">
              {profile.nik || "Belum Terdaftar"}
            </p>
          </div>
        </div>

        {/* KK Card */}
        <div className="p-4 border border-gray-border rounded-xl bg-gray-card flex items-start gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-gray-secondary-text">Nomor Kartu Keluarga (KK)</span>
            <p className="text-sm font-bold text-gray-heading-main font-mono">
              {profile.familyNumber || "Belum Terdaftar"}
            </p>
          </div>
        </div>

        {/* Dwelling Card */}
        <div className="p-4 border border-gray-border rounded-xl bg-gray-card flex items-start gap-3.5 shadow-2xs md:col-span-2">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold text-gray-secondary-text">Alamat & Hunian Terdaftar</span>
            <p className="text-sm font-bold text-gray-heading-main">
              {profile.dwellingInfo
                ? `Blok ${profile.dwellingInfo.blockNumber} No. ${profile.dwellingInfo.houseNumber} (${profile.dwellingInfo.type.toUpperCase()})`
                : profile.unitNumber
                ? `Unit / No. ${profile.unitNumber}`
                : "Belum Terdaftar pada Unit Hunian"}
            </p>
            {profile.familyInfo?.headName && (
              <p className="text-xs text-gray-secondary-text">
                Kepala Keluarga: {profile.familyInfo.headName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Account Verification Footer */}
      <div className="p-4 bg-gray-sidebar-hover border border-gray-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-heading-main">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Status Verifikasi Akun: <strong>TERVERIFIKASI SISTEM RT</strong></span>
        </div>
      </div>
    </div>
  );
};
