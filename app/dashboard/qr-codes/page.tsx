"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Settings, QrCode, Link2 } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { QrTemplateType } from "@/components/QrCodePrintCanvas";
import { QrPageData } from "./types";
import { QrSettingTab } from "./_components/QrSettingTab";
import { DwellingQrTableTab } from "./_components/DwellingQrTableTab";
import { CustomUrlQrTab } from "./_components/CustomUrlQrTab";

export default function QrCodesPage() {
  const [data, setData] = useState<QrPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: "setting" | "hunian" | "custom"
  const [activeTab, setActiveTab] = useState<"setting" | "hunian" | "custom">("setting");

  // Global Settings State (Diatur di Tab 1, dipakai oleh Tab 2 & Tab 3)
  const [template, setTemplate] = useState<QrTemplateType>("mini_sticker");
  const [title, setTitle] = useState<string>("STIKER PINTU RUMAH WARGA");
  const [subtitle, setSubtitle] = useState<string>(
    "Pindai QR code ini menggunakan kamera HP untuk mengakses profil & informasi resmi hunian."
  );

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
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="space-y-2">
          <div className="h-8 w-80 bg-gray-border/60 rounded-xl" />
          <div className="h-4 w-96 bg-gray-border/40 rounded-lg" />
        </div>
        <div className="h-12 w-full max-w-lg bg-gray-card rounded-2xl" />
        <div className="h-96 bg-gray-card border border-gray-border rounded-2xl" />
      </div>
    );
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
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex flex-col sm:flex-row items-center gap-2 max-w-xl print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("setting")}
          className={`flex-1 w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "setting"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>1. Pengaturan QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hunian")}
          className={`flex-1 w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "hunian"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. Cetak QR Hunian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`flex-1 w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "custom"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>3. Custom QR</span>
        </button>
      </div>

      {/* TAB 1: PENGATURAN QR (Setting + Live Preview Eksklusif) */}
      {activeTab === "setting" && (
        <div className="print:hidden">
          <QrSettingTab
            template={template}
            title={title}
            subtitle={subtitle}
            onTemplateChange={setTemplate}
            onTitleChange={setTitle}
            onSubtitleChange={setSubtitle}
          />
        </div>
      )}

      {/* TAB 2: CETAK QR HUNIAN */}
      {activeTab === "hunian" && (
        <div className="print:hidden">
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
        <div className="print:hidden">
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
