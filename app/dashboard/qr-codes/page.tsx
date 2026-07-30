"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { QrTemplateType } from "@/components/QrCodePrintCanvas";
import { QrPageData } from "./types";
import { QrSettingCard } from "./_components/QrSettingCard";
import { DwellingQrTable } from "./_components/DwellingQrTable";
import { CustomUrlQrCard } from "./_components/CustomUrlQrCard";

export default function QrCodesPage() {
  const [data, setData] = useState<QrPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings State
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
        <div className="h-44 bg-gray-card border border-gray-border rounded-2xl" />
        <div className="h-96 bg-gray-card border border-gray-border rounded-2xl" />
        <div className="h-44 bg-gray-card border border-gray-border rounded-2xl" />
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
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
          Cetak QR Code Hunian
        </h1>
        <p className="text-sm text-gray-secondary-text mt-0.5">
          Kelola pengaturan stiker QR Code, pilih hunian untuk dicetak / diunduh, atau buat QR Code dengan link custom.
        </p>
      </div>

      {/* BAGIAN 1: SETTING QR CODE */}
      <div className="print:hidden">
        <QrSettingCard
          template={template}
          title={title}
          subtitle={subtitle}
          onTemplateChange={setTemplate}
          onTitleChange={setTitle}
          onSubtitleChange={setSubtitle}
        />
      </div>

      {/* BAGIAN 2: CETAK QR HUNIAN (SEMUA TIPE HUNIAN) */}
      <div className="print:hidden">
        <DwellingQrTable
          dwellings={data.dwellings}
          template={template}
          title={title}
          subtitle={subtitle}
        />
      </div>

      {/* BAGIAN 3: BUAT QR DENGAN LINK CUSTOM */}
      <div className="print:hidden">
        <CustomUrlQrCard
          template={template}
          title={title}
          subtitle={subtitle}
        />
      </div>
    </div>
  );
}
