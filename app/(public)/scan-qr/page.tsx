"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  QrCode,
  Search,
  RefreshCw,
  Camera,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicScanResultData, DetailedScanResultData } from "@/db/queries/dashboard/public-portal.queries";
import { LiveCameraScanner } from "./_components/LiveCameraScanner";
import { ScanResultCard } from "./_components/ScanResultCard";
import { DwellingNotFoundState } from "./_components/DwellingNotFoundState";
import { authClient } from "@/lib/auth-client";
import { useRoleStore } from "@/lib/store/use-role-store";

function PublicScanQrContent() {
  const searchParams = useSearchParams();

  const router = useRouter();
  const initialToken = searchParams.get("token") || searchParams.get("code") || "";

  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { activeRoleId } = useRoleStore();

  const [activeTab, setActiveTab] = useState<"kamera" | "manual">("kamera");
  const [inputToken, setInputToken] = useState(initialToken);
  const [isSearching, setIsSearching] = useState(() => Boolean(initialToken.trim()));
  const [scanResult, setScanResult] = useState<PublicScanResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Token yang sedang diproses (ref untuk hindari race condition)
  const activeTokenRef = useRef<string>(initialToken);

  // State untuk post-scan (ownership check + detail data)
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
  const [scanMode, setScanMode] = useState<"publik" | "warga-login" | "officer" | "tamu-login">("publik");
  const [detailData, setDetailData] = useState<DetailedScanResultData | null>(null);

  const executeFetch = useCallback((query: string) => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    activeTokenRef.current = trimmed; // Simpan token yang aktif sekarang
    setIsSearching(true);
    setErrorMessage(null);
    setScanResult(null);
    setDetailData(null);
    setScanMode("publik");

    fetch(`/api/public/scan?token=${encodeURIComponent(trimmed)}`)
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          setScanResult(json.data);
          toast.success("QR Code / Hunian berhasil ditemukan!");
        } else {
          const err = await res.json();
          setErrorMessage(err.error || "Data hunian atau QR Code tidak ditemukan");
        }
      })
      .catch((error) => {
        console.error("Error fetching scan data:", error);
        setErrorMessage("Terjadi kesalahan koneksi jaringan");
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, []);

  // Auto-fetch on mount jika ada query param
  useEffect(() => {
    const token = initialToken.trim();
    if (!token) return;

    let isCancelled = false;
    activeTokenRef.current = token;

    async function doInitialFetch() {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/public/scan?token=${encodeURIComponent(token)}`
        );
        if (isCancelled) return;

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
        if (!isCancelled) setErrorMessage("Terjadi kesalahan koneksi jaringan");
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }

    doInitialFetch();

    return () => {
      isCancelled = true;
    };
  }, [initialToken]);

  // Post-scan logic: Cek session & ownership setelah scanResult berhasil dimuat
  useEffect(() => {
    if (!scanResult || isSessionPending || !session?.user) return;

    let isCancelled = false;
    const tokenToCheck = activeTokenRef.current; // Gunakan ref, bukan variabel render

    async function checkOwnershipAndDetail() {
      setIsCheckingOwnership(true);
      try {
        // Kirim activeRoleId ke API agar bisa menentukan mode officer vs tamu
        const roleParam = activeRoleId !== null ? `&roleId=${activeRoleId}` : "";
        const ownerRes = await fetch(
          `/api/public/scan/ownership?token=${encodeURIComponent(tokenToCheck)}${roleParam}`
        );
        if (isCancelled) return;

        if (!ownerRes.ok) {
          setScanMode("tamu-login");
          return;
        }

        const ownerData = await ownerRes.json();
        const { ownershipStatus, redirectTarget } = ownerData;

        // Status yang langsung redirect
        const redirectStatuses = [
          "pemilik-permanen",
          "pemilik-kos",
          "kepala-keluarga-permanen",
          "kepala-keluarga-kos",
          "koordinator-kos",
        ];

        if (redirectStatuses.includes(ownershipStatus) && redirectTarget) {
          // Sinkronkan role aktif dashboard sesuai dengan halaman tujuan redirect
          if (ownerData.targetRoleId) {
            useRoleStore.getState().setActiveRoleId(ownerData.targetRoleId);
          }

          const statusMessages: Record<string, string> = {
            "pemilik-permanen": "Selamat datang! Mengarahkan ke dashboard Anda...",
            "pemilik-kos": "Properti Anda ditemukan! Mengarahkan ke kelola properti...",
            "kepala-keluarga-permanen": "Rumah Anda ditemukan! Mengarahkan ke data keluarga...",
            "kepala-keluarga-kos": "Lokasi kos Anda ditemukan! Mengarahkan ke data keluarga...",
            "koordinator-kos": "Properti kos Anda ditemukan! Mengarahkan ke kelola penyewa kos...",
          };
          toast.success(statusMessages[ownershipStatus] || "Mengarahkan...", { duration: 2000 });
          setTimeout(() => {
            router.push(redirectTarget);
          }, 800);
          return;
        }


        // Mode officer: tampilkan kartu publik dengan banner khusus
        if (ownershipStatus === "officer") {
          setScanMode("officer");
          return;
        }

        // Tamu login: ambil data detail (agregat)
        setScanMode("tamu-login");
        const detailRes = await fetch(
          `/api/public/scan/detail?token=${encodeURIComponent(tokenToCheck)}`
        );
        if (isCancelled) return;

        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          setDetailData(detailJson.data);
        }
      } catch (error) {
        console.error("Error during post-scan ownership check:", error);
        if (!isCancelled) setScanMode("tamu-login");
      } finally {
        if (!isCancelled) setIsCheckingOwnership(false);
      }
    }

    checkOwnershipAndDetail();

    return () => {
      isCancelled = true;
    };
  }, [scanResult, session, isSessionPending, activeRoleId, router]);

  const handleResetScan = () => {
    setScanResult(null);
    setDetailData(null);
    setErrorMessage(null);
    setInputToken("");
    setScanMode("publik");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      toast.error("Mohon ketik Blok & Nomor Rumah atau Token QR");
      return;
    }
    executeFetch(inputToken.trim());
  };

  const isLoadingAny = isSearching || isCheckingOwnership;

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={QrCode}
        title="Scan QR Code Hunian"
        subtitle="Memulai pemindaian stiker QR Code di dinding/pintu rumah warga atau ketik blok/nomor rumah secara manual."
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-6 pb-12">
        {/* FASE 1: INPUT SCANNER (Hanya tampil jika BELUM ada hasil scan) */}
        {!scanResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
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
                <span>Scan Kamera</span>
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
                <span>Nomor Rumah</span>
              </button>
            </div>

            {/* TAB 1: LIVE CAMERA SCANNER COMPONENT */}
            {activeTab === "kamera" && (
              <div className="animate-in fade-in duration-200">
                <LiveCameraScanner
                  onScanSuccess={(token) => {
                    setInputToken(token);
                    executeFetch(token);
                  }}
                />
              </div>
            )}

            {/* TAB 2: MANUAL SEARCH BOX */}
            {activeTab === "manual" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Pencarian Manual Blok / Nomor Rumah
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Ketikkan Blok &amp; Nomor Rumah (contoh:{" "}
                      <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">A1-12</code>,{" "}
                      <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Blok A1 No. 12</code>, atau{" "}
                      <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">qr-dwelling-xxx</code>).
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
                      className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingAny}
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

            {/* Friendly Empty / Not Found State */}
            {errorMessage && (
              <DwellingNotFoundState
                searchedQuery={inputToken || initialToken}
                errorMessage={errorMessage}
                onRetry={() => {
                  const q = (inputToken || initialToken).trim();
                  if (q) executeFetch(q);
                  else setErrorMessage(null);
                }}
                isLoading={isLoadingAny}
              />
            )}
          </div>
        )}

        {/* FASE 2: RESULT VIEW (Hanya tampil jika SCAN/SEARCH BERHASIL) */}
        {scanResult && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-800">
            {/* Top Action Bar saat Hasil Scan Berhasil Tampil */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 bg-linear-to-r from-blue-50/50 via-indigo-50/30 to-white">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">QR Code / Hunian Ditemukan!</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Profil hunian di bawah ini ditampilkan sesuai dengan hak akses sesi Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetScan}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-sm cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Scan QR / Cari Rumah Lain</span>
              </button>
            </div>

            {/* Loading state saat session/ownership sedang memproses detail */}
            {(isCheckingOwnership || isSessionPending) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-50">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Memverifikasi akses...</p>
                  <p className="text-xs text-slate-500 font-medium">
                    Mengecek apakah hunian ini terhubung dengan akun Anda.
                  </p>
                </div>
              </div>
            )}

            {/* RESULT PROFILE CARD COMPONENT */}
            {!isCheckingOwnership && !isSessionPending && scanMode === "publik" && (
              <ScanResultCard
                mode="publik"
                scanResult={scanResult}
              />
            )}
            {!isCheckingOwnership && !isSessionPending && scanMode === "officer" && (
              <ScanResultCard
                mode="officer"
                scanResult={scanResult}
              />
            )}
            {!isCheckingOwnership && !isSessionPending && scanMode === "tamu-login" && (
              <ScanResultCard
                mode="warga-login"
                scanResult={scanResult}
                detailData={detailData ?? {
                  id: scanResult.id,
                  blockNumber: scanResult.blockNumber,
                  houseNumber: scanResult.houseNumber,
                  type: scanResult.type,
                  latitude: scanResult.latitude,
                  longitude: scanResult.longitude,
                  ownerName: scanResult.ownerName,
                  ownerPhone: scanResult.ownerPhone,
                  propertyName: scanResult.propertyName,
                  totalRooms: scanResult.totalRooms,
                  occupiedRooms: scanResult.occupiedRooms,
                  availableRooms: scanResult.availableRooms,
                  activeResidents: [],
                  activeKkCount: 0,
                  rtName: scanResult.rtName,
                  rwName: scanResult.rwName,
                  villageName: scanResult.villageName,
                }}
                loggedInUserName={session?.user?.name}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}


export default function PublicScanQrPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-100 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PublicScanQrContent />
    </Suspense>
  );
}

