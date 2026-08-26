"use client";

import React, { useState } from "react";
import { IdCard, Home, FileText, ShieldCheck, Info } from "lucide-react";
import { UserProfileData } from "../types";
import { RegisterMyFamilyModal } from "../../family/_components/RegisterMyFamilyModal";

interface ResidencyInfoTabProps {
  profile: UserProfileData;
}

export const ResidencyInfoTab: React.FC<ResidencyInfoTabProps> = ({ profile }) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

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
          Data Hunian Hanya Bisa Di Ubah Oleh Pengurus RT/RW.
        </span>
      </div>

      {/* Conditional: Jika akun adalah Super Admin (Role 1), tampilkan banner info Admin dan sembunyikan tombol pendaftaran KK */}
      {profile.roleIds?.includes(1) || profile.roleId === 1 || profile.roleSlug === "super-admin" || profile.roleSlug === "admin" ? (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900 font-semibold shadow-2xs">
          <ShieldCheck className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          <span>
            Akun Anda adalah <strong>Super Admin (Pengelola Sistem)</strong>. Akun khusus ini tidak terikat dengan data Kartu Keluarga.
          </span>
        </div>
      ) : !profile.familyNumber && !profile.familyInfo && !profile.residentInfo ? (
        <div className="p-5 border border-primary/20 bg-primary/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-gray-heading-main">
              Kartu Keluarga Belum Terdaftar
            </h4>
            <p className="text-xs text-gray-secondary-text max-w-lg">
              Akun Anda belum terdaftar dalam Kartu Keluarga (KK). Daftarkan KK Anda untuk mengaktifkan akses Warga dan mengelola data kependudukan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="shrink-0 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Daftarkan KK Mandiri</span>
          </button>
        </div>
      ) : profile.residentInfo && profile.residentInfo.relationship !== "Kepala_Keluarga" ? (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900 font-semibold">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>
            Akun Anda terdaftar sebagai <strong>{profile.residentInfo.relationship.replace("_", " ")}</strong> di Kartu Keluarga <strong>{profile.familyInfo?.headName || "Keluarga"}</strong>.
          </span>
        </div>
      ) : null}

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
              {profile.familyNumber || profile.familyInfo?.familyNumber || "Belum Terdaftar"}
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

      <RegisterMyFamilyModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          window.location.reload();
        }}
        userName={profile.name}
        userNik={profile.nik || undefined}
      />
    </div>
  );
};

