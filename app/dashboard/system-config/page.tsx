"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import { SystemSettingsData, SystemConfigFormState, EmergencyContactItem } from "./types";
import { SystemConfigKpiCards } from "./_components/SystemConfigKpiCards";
import { IdentityFormSection } from "./_components/IdentityFormSection";
import { OfficialContactFormSection } from "./_components/OfficialContactFormSection";
import { BrandingLogoFormSection } from "./_components/BrandingLogoFormSection";
import { EmergencyContactFormSection } from "./_components/EmergencyContactFormSection";
import { SystemConfigSkeleton } from "./_components/SystemConfigSkeleton";
import { PermissionGuard } from "@/components/PermissionGuard";

const EMPTY_FORM: SystemConfigFormState = {
  rtName: "",
  rwName: "",
  villageName: "",
  subdistrict: "",
  city: "",
  secretariatAddress: "",
  logoPath: null,
  officialEmail: "",
  officialRtPhone: "",
  officialSecretaryPhone: "",
  officialTreasurerPhone: "",
  emergencyContacts: [],
  latitude: "",
  longitude: "",
};

function mapSettingsToForm(s: SystemSettingsData): SystemConfigFormState {
  return {
    rtName: s.rtName || "",
    rwName: s.rwName || "",
    villageName: s.villageName || "",
    subdistrict: s.subdistrict || "",
    city: s.city || "",
    secretariatAddress: s.secretariatAddress || "",
    logoPath: s.logoPath || null,
    officialEmail: s.officialEmail || "",
    officialRtPhone: s.officialRtPhone || "",
    officialSecretaryPhone: s.officialSecretaryPhone || "",
    officialTreasurerPhone: s.officialTreasurerPhone || "",
    emergencyContacts: Array.isArray(s.emergencyContacts) ? s.emergencyContacts : [],
    latitude: s.latitude || "",
    longitude: s.longitude || "",
  };
}

export default function SystemConfigPage() {
  return (
    <PermissionGuard requiredPermission="manage-system-config">
      <SystemConfigContent />
    </PermissionGuard>
  );
}

function SystemConfigContent() {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [form, setForm] = useState<SystemConfigFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system-config");
      if (!res.ok) throw new Error("Gagal memuat konfigurasi sistem");
      const json = await res.json();
      const s = json.settings;
      setSettings(s);
      setForm(mapSettingsToForm(s));
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    async function loadInitialData() {
      try {
        const res = await fetch("/api/system-config");
        if (!res.ok) throw new Error("Gagal memuat konfigurasi sistem");
        const json = await res.json();
        const s = json.settings;
        if (!isCancelled) {
          setSettings(s);
          setForm(mapSettingsToForm(s));
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan koneksi");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChange = (field: keyof SystemConfigFormState, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmergencyContactsChange = (contacts: EmergencyContactItem[]) => {
    setForm((prev) => ({ ...prev, emergencyContacts: contacts }));
  };

  const handleSave = async () => {
    // Validasi field wajib
    if (!form.rtName?.trim()) {
      toast.error("Nama RT wajib diisi");
      return;
    }
    if (!form.rwName?.trim()) {
      toast.error("Nama RW wajib diisi");
      return;
    }
    if (!form.villageName?.trim()) {
      toast.error("Nama Kelurahan/Desa wajib diisi");
      return;
    }
    if (!form.subdistrict?.trim()) {
      toast.error("Nama Kecamatan wajib diisi");
      return;
    }
    if (!form.city?.trim()) {
      toast.error("Nama Kota/Kabupaten wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/system-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan konfigurasi");
      }

      const json = await res.json();
      setSettings(json.settings);
      toast.success("Konfigurasi sistem berhasil disimpan!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan konfigurasi");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (isLoading) {
    return <SystemConfigSkeleton />;
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !settings) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Konfigurasi sistem tidak dapat dimuat."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={handleRetry} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
            Konfigurasi Sistem
          </h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">
            Atur identitas wilayah, branding logo kop surat, kontak official, dan kontak darurat warga yang tampil di seluruh sistem.
          </p>
        </div>

        {/* Tombol Simpan */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </>
          )}
        </button>
      </div>

      {/* 1. KPI Cards */}
      <SystemConfigKpiCards settings={settings} />

      {/* 2. Identitas Wilayah Form */}
      <IdentityFormSection form={form} onChange={handleChange} />

      {/* 3. Branding Logo Form */}
      <BrandingLogoFormSection form={form} onChange={handleChange} />

      {/* 4. Kontak Official Form */}
      <OfficialContactFormSection form={form} onChange={handleChange} />

      {/* 5. Kontak Darurat Warga Form */}
      <EmergencyContactFormSection
        contacts={form.emergencyContacts || []}
        onChange={handleEmergencyContactsChange}
      />

      {/* Footer Simpan Button (sticky bottom for mobile) */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
