"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  Search,
  RefreshCw,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { PublicScanResultData } from "@/db/queries/public-portal";
import { LiveCameraScanner } from "./_components/LiveCameraScanner";
import { ScanResultCard } from "./_components/ScanResultCard";

export default function PublicScanQrPage() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || searchParams.get("code") || "";

  const [activeTab, setActiveTab] = useState<"kamera" | "manual">("kamera");
  const [inputToken, setInputToken] = useState(initialToken);
  const [isSearching, setIsSearching] = useState(() => Boolean(initialToken.trim()));
  const [scanResult, setScanResult] = useState<PublicScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeFetch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const res = await fetch(`/api/public/scan?token=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const json = await res.json();
        setScanResult(json.data);
        toast.success("QR Code / Hunian berhasil ditemukan!");
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Data hunian atau QR Code tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching scan data:", error);
      setErrorMessage("Terjadi kesalahan koneksi jaringan");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-fetch on mount if query param exists
  useEffect(() => {
    if (!initialToken.trim()) return;

    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/public/scan?token=${encodeURIComponent(initialToken.trim())}`);
        if (!isMounted) return;
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setScanResult(json.data);
        } else {
          const json = await res.json();
          if (isMounted) setErrorMessage(json.error || "Data hunian atau QR Code tidak ditemukan");
        }
      } catch {
        if (isMounted) setErrorMessage("Terjadi kesalahan koneksi jaringan");
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [initialToken]);

  // Manual search submit triggered by user
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      toast.error("Mohon ketik Blok & Nomor Rumah atau Token QR");
      return;
    }
    executeFetch(inputToken.trim());
  };

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={QrCode}
        title="Scan QR Code Hunian"
        subtitle="Memulai pemindaian stiker QR Code di dinding/pintu rumah warga atau ketik blok/nomor rumah secara manual."
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-6 pb-12">
        {/* Navigation Tabs Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("kamera")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "kamera"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Kamera HP (Live)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Cari Blok & Nomor Rumah</span>
          </button>
        </div>

        {/* TAB 1: LIVE CAMERA SCANNER COMPONENT */}
        {activeTab === "kamera" && (
          <LiveCameraScanner
            onScanSuccess={(token) => {
              setInputToken(token);
              executeFetch(token);
            }}
          />
        )}

        {/* TAB 2: MANUAL SEARCH BOX */}
        {activeTab === "manual" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Pencarian Manual Blok / Nomor Rumah
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Ketikkan Blok & Nomor Rumah (contoh: <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">A1-12</code>, <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Blok A1 No. 12</code>, atau <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">qr-dwelling-xxx</code>).
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Ketik Blok & Nomor Rumah (contoh: A1-12)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold shadow-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Tampilkan Profil</span>
              </button>
            </form>
          </div>
        )}

        {/* Error Message Alert */}
        {errorMessage && (
          <PublicErrorState
            title="Hunian Tidak Ditemukan"
            message={errorMessage}
            onRetry={() => {
              if (inputToken.trim()) executeFetch(inputToken.trim());
              else setErrorMessage(null);
            }}
            isLoading={isSearching}
          />
        )}

        {/* RESULT PROFILE CARD COMPONENT */}
        {scanResult && <ScanResultCard scanResult={scanResult} />}
      </section>
    </>
  );
}
