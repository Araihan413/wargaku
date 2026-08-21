"use client";

import React, { useState } from "react";
import { LayoutDashboard, HelpCircle, Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { UserProfileData } from "../types";

interface PrimaryRolePreferenceCardProps {
  profile: UserProfileData;
  onUpdate: (updatedProfile: UserProfileData) => void;
}

export const PrimaryRolePreferenceCard: React.FC<PrimaryRolePreferenceCardProps> = ({
  profile,
  onUpdate,
}) => {
  const roles = profile.roles || [];
  const currentPrimaryRole = roles.find((r) => r.isPrimary)?.roleId ?? profile.roleId;

  const [selectedRoleId, setSelectedRoleId] = useState<number>(currentPrimaryRole);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Jangan tampilkan jika pengguna hanya memiliki 1 peran atau tidak memiliki multi-role
  if (roles.length <= 1) {
    return null;
  }

  const handleSave = async () => {
    if (selectedRoleId === currentPrimaryRole) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile/set-primary-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui preferensi peran utama");
      }

      toast.success("Preferensi tampilan utama berhasil disimpan!");
      if (data.profile) {
        onUpdate(data.profile);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Terjadi kesalahan saat menyimpan preferensi.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeDescription = (slug: string) => {
    switch (slug) {
      case "admin":
        return "Akses penuh ke seluruh modul sistem";
      case "ketua_rt":
        return "Pengelolaan kependudukan, persetujuan berkas, & laporan warga";
      case "sekretaris":
        return "Administrasi data kependudukan & mutasi Kartu Keluarga";
      case "bendahara":
        return "Pengelolaan kas keuangan RT & pencatatan iuran warga";
      case "koordinator_kos":
        return "Pengelolaan unit sewa/kos & pendaftaran anak kos";
      case "warga":
      default:
        return "Layanan mandiri kependudukan & pembayaran iuran keluarga";
    }
  };

  return (
    <div className="bg-white border border-gray-border rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header with Tooltip Help Icon */}
      <div className="border-b border-gray-border pb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              Tampilan Utama Saat Login
            </h2>

            {/* Interactive Help Icon (Hover on Desktop, Click/Tap on Mobile) */}
            <div className="relative inline-block">
              <button
                type="button"
                aria-label="Penjelasan pengaturan tampilan utama"
                onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                onMouseEnter={() => setShowHelpTooltip(true)}
                onMouseLeave={() => setShowHelpTooltip(false)}
                className="text-gray-placeholder hover:text-primary transition-colors cursor-pointer p-0.5 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Tooltip Content (Option 1 Text) */}
              {showHelpTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
                  <p className="leading-relaxed">
                    Menentukan dashboard pembuka saat Anda login baru. Selama belum logout, sistem tetap mengingat peran terakhir yang Anda gunakan.
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-secondary-text mt-1">
            Pilih peran yang ingin otomatis aktif saat pertama kali masuk ke aplikasi.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
          Multi-Role
        </span>
      </div>

      {/* Role Radio List Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {roles.map((r) => {
          const isSelected = selectedRoleId === r.roleId;
          const isCurrentActivePrimary = r.isPrimary;

          return (
            <div
              key={r.roleId}
              onClick={() => setSelectedRoleId(r.roleId)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-gray-border bg-gray-card hover:border-gray-placeholder/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-heading-main">
                      {r.roleName}
                    </span>
                    {isCurrentActivePrimary && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                        Utama Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-secondary-text leading-relaxed">
                    {getRoleBadgeDescription(r.roleSlug)}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-border bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-3" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Save Button */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || selectedRoleId === currentPrimaryRole}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Preferensi...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Tampilan Utama</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
