"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { QrPageData, QrConfigState, QrPresetType } from "./types";
import { QrPresetSelector } from "./_components/QrPresetSelector";
import { QrConfigFormBar } from "./_components/QrConfigFormBar";
import { QrPreviewPrintContainer } from "./_components/QrPreviewPrintContainer";

const DEFAULT_CONFIG: QrConfigState = {
  preset: "rt_public",
  selectedDwellingId: null,
  customUrl: "",
  title: "PORTAL ADUAN & LAYANAN WARGA",
  subtitle: "Pindai QR code ini menggunakan kamera HP untuk melaporkan aduan, verifikasi warga, atau mengakses informasi resmi RT.",
  template: "a4_poster",
  showContacts: true,
  showLogo: true,
};

export default function QrCodesPage() {
  const [data, setData] = useState<QrPageData | null>(null);
  const [config, setConfig] = useState<QrConfigState>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handlePresetSelect = (preset: QrPresetType) => {
    if (!data) return;
    const rtLabel = `RT ${data.systemSettings.rtName} / RW ${data.systemSettings.rwName}`;

    if (preset === "rt_public") {
      setConfig((prev) => ({
        ...prev,
        preset: "rt_public",
        title: "PORTAL ADUAN & LAYANAN WARGA",
        subtitle: `Pindai QR code ini untuk mengakses portal layanan publik resmi ${rtLabel}.`,
        selectedDwellingId: null,
      }));
    } else if (preset === "dwelling_sticker") {
      const firstDwelling = data.dwellings[0];
      setConfig((prev) => ({
        ...prev,
        preset: "dwelling_sticker",
        title: firstDwelling
          ? `STIKER PINTU — BLOK ${firstDwelling.blockNumber} NO. ${firstDwelling.houseNumber}`
          : "STIKER PINTU RUMAH WARGA",
        subtitle: "Verifikasi identitas rumah warga & laporan cepat pengurus RT.",
        selectedDwellingId: firstDwelling ? firstDwelling.id : null,
      }));
    } else if (preset === "rental_property") {
      const firstDwelling = data.dwellings.find((d) => d.type === "kos") || data.dwellings[0];
      setConfig((prev) => ({
        ...prev,
        preset: "rental_property",
        title: firstDwelling
          ? `PAPAN INFO KOS — BLOK ${firstDwelling.blockNumber} NO. ${firstDwelling.houseNumber}`
          : "PAPAN INFO KOS & SEWA",
        subtitle: "Pindai untuk pendaftaran & verifikasi data anak kos / penghuni sewa.",
        selectedDwellingId: firstDwelling ? firstDwelling.id : null,
      }));
    } else if (preset === "custom_url") {
      setConfig((prev) => ({
        ...prev,
        preset: "custom_url",
        title: "INFORMASI DOKUMEN RESMI RT",
        subtitle: "Pindai QR code ini untuk membuka tautan acuan dokumen.",
        customUrl: "https://wargaku.app",
        selectedDwellingId: null,
      }));
    }
  };

  const handleConfigChange = (newConfig: Partial<QrConfigState>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };

      // Update title dynamically if dwelling selection changed
      if (
        newConfig.selectedDwellingId &&
        data &&
        (updated.preset === "dwelling_sticker" || updated.preset === "rental_property")
      ) {
        const found = data.dwellings.find((d) => d.id === newConfig.selectedDwellingId);
        if (found) {
          const prefix = updated.preset === "dwelling_sticker" ? "STIKER PINTU" : "PAPAN INFO KOS";
          updated.title = `${prefix} — BLOK ${found.blockNumber} NO. ${found.houseNumber}`;
        }
      }

      return updated;
    });
  };

  // Compute Target QR URL
  const getComputedQrUrl = (): string => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://wargaku.app";

    if (config.preset === "custom_url") {
      return config.customUrl || origin;
    }

    if (
      (config.preset === "dwelling_sticker" || config.preset === "rental_property") &&
      config.selectedDwellingId &&
      data
    ) {
      const dwelling = data.dwellings.find((d) => d.id === config.selectedDwellingId);
      if (dwelling?.qrToken) {
        return `${origin}/scan/${dwelling.qrToken}`;
      }
    }

    // Default: Public RT portal URL
    return `${origin}/public`;
  };

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="space-y-2">
          <div className="h-8 w-80 bg-gray-border/60 rounded-xl" />
          <div className="h-4 w-96 bg-gray-border/40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-card border border-gray-border rounded-2xl" />
          ))}
        </div>
        <div className="h-44 bg-gray-card border border-gray-border rounded-2xl" />
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

  const computedQrUrl = getComputedQrUrl();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main flex items-center gap-2.5">
          Cetak QR Code Hunian
        </h1>
        <p className="text-sm text-gray-secondary-text mt-0.5">
          Fasilitas generator & cetak fisik QR Code resmi RT, Sekretariat, stiker pintu rumah warga, dan papan info kos.
        </p>
      </div>

      {/* 1. Preset Data Selector */}
      <div className="print:hidden">
        <QrPresetSelector
          selectedPreset={config.preset}
          onSelectPreset={handlePresetSelect}
        />
      </div>

      {/* 2. Configuration Form Bar */}
      <div className="print:hidden">
        <QrConfigFormBar
          config={config}
          dwellings={data.dwellings}
          onChange={handleConfigChange}
        />
      </div>

      {/* 3. Live Preview & Print Container */}
      <QrPreviewPrintContainer
        config={config}
        data={data}
        computedQrUrl={computedQrUrl}
      />
    </div>
  );
}
