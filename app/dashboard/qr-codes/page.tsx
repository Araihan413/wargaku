"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Settings, QrCode, Link2 } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { QrTemplateType } from "@/components/QrCodePrintCanvas";
import { QrPageData } from "./types";
import { QrSettingTab } from "./_components/QrSettingTab";
import { DwellingQrTableTab } from "./_components/DwellingQrTableTab";
import { CustomUrlQrTab } from "./_components/CustomUrlQrTab";
import { QrCodesSkeleton } from "./_components/QrCodesSkeleton";

export default function QrCodesPage() {
  const [data, setData] = useState<QrPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: "setting" | "hunian" | "custom"
  const [activeTab, setActiveTab] = useState<"setting" | "hunian" | "custom">("setting");

  // Global Settings State (Diatur di Tab 1, disimpan di localStorage, dipakai oleh Tab 2 & Tab 3)
  const [template, setTemplate] = useState<QrTemplateType>(() => {
    if (typeof window === "undefined") return "mini_sticker";
    try {
      const saved = localStorage.getItem("wargaku_qr_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.template) return parsed.template;
      }
    } catch {
      // ignore
    }
    return "mini_sticker";
  });

  const [title, setTitle] = useState<string>(() => {
    if (typeof window === "undefined") return "STIKER PINTU RUMAH WARGA";
    try {
      const saved = localStorage.getItem("wargaku_qr_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title !== undefined) return parsed.title;
      }
    } catch {
      // ignore
    }
    return "STIKER PINTU RUMAH WARGA";
  });

  const [subtitle, setSubtitle] = useState<string>(() => {
    if (typeof window === "undefined") return "Pindai QR code ini menggunakan kamera HP untuk mengakses profil & informasi resmi hunian.";
    try {
      const saved = localStorage.getItem("wargaku_qr_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subtitle !== undefined) return parsed.subtitle;
      }
    } catch {
      // ignore
    }
    return "Pindai QR code ini menggunakan kamera HP untuk mengakses profil & informasi resmi hunian.";
  });

  const saveSettingsToLocalStorage = (t: QrTemplateType, ti: string, sub: string) => {
    try {
      localStorage.setItem(
        "wargaku_qr_settings",
        JSON.stringify({ template: t, title: ti, subtitle: sub })
      );
    } catch (e) {
      console.error("Error saving QR settings to localStorage:", e);
    }
  };

  const handleTemplateChange = (val: QrTemplateType) => {
    setTemplate(val);
    saveSettingsToLocalStorage(val, title, subtitle);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    saveSettingsToLocalStorage(template, val, subtitle);
  };

  const handleSubtitleChange = (val: string) => {
    setSubtitle(val);
    saveSettingsToLocalStorage(template, title, val);
  };

  const loadData = () => {
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/qr-codes/data");
        if (!res.ok) throw new Error("Gagal memuat data pendukung QR code");
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
        const res = await fetch("/api/qr-codes/data");
        if (!res.ok) throw new Error("Gagal memuat data pendukung QR code");
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
    return <QrCodesSkeleton />;
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-error" />
        <h3 className="mt-4 text-lg font-semibold text-gray-heading-main">Terjadi Kesalahan</h3>
        <p className="mt-2 max-w-md text-sm text-gray-secondary-text">
          {error || "Data pendukung QR Code tidak dapat dimuat."}
        </p>
        <div className="mt-4">
          <RefreshButton onClick={loadData} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
          Cetak QR Code Hunian
        </h1>
        <p className="text-sm text-gray-secondary-text mt-0.5">
          Atur desain stiker di Tab 1 (Pengaturan), cetak QR hunian di Tab 2, atau buat QR link custom di Tab 3.
        </p>
      </div>

      {/* Main 3-Tab Navigation Bar */}
      <div className="flex border-b border-gray-border overflow-x-auto no-scrollbar mb-6 gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("setting")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "setting"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <Settings className={`h-4.5 w-4.5 ${activeTab === "setting" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Pengaturan QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hunian")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "hunian"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <QrCode className={`h-4.5 w-4.5 ${activeTab === "hunian" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Cetak QR Hunian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "custom"
              ? "border-primary text-primary"
              : "border-transparent text-gray-secondary-text hover:text-gray-heading-main hover:border-gray-border"
          }`}
        >
          <Link2 className={`h-4.5 w-4.5 ${activeTab === "custom" ? "text-primary" : "text-gray-secondary-text"}`} />
          <span>Custom QR Link</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN QR (Setting + Live Preview Eksklusif) */}
      {activeTab === "setting" && (
        <div className="print:hidden">
          <QrSettingTab
            template={template}
            title={title}
            subtitle={subtitle}
            onTemplateChange={handleTemplateChange}
            onTitleChange={handleTitleChange}
            onSubtitleChange={handleSubtitleChange}
          />
        </div>
      )}

      {/* TAB 2: CETAK QR HUNIAN */}
      {activeTab === "hunian" && (
        <div>
          <DwellingQrTableTab
            dwellings={data.dwellings}
            template={template}
            title={title}
            subtitle={subtitle}
          />
        </div>
      )}

      {/* TAB 3: CUSTOM QR */}
      {activeTab === "custom" && (
        <div>
          <CustomUrlQrTab
            template={template}
            title={title}
            subtitle={subtitle}
          />
        </div>
      )}
    </div>
  );
}
