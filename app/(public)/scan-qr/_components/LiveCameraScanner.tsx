"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  ImageUp,
  QrCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import Image from "next/image";

interface LiveCameraScannerProps {
  onScanSuccess: (token: string) => void;
}

type ScanMode = "camera" | "image";

export const LiveCameraScanner: React.FC<LiveCameraScannerProps> = ({ onScanSuccess }) => {
  const [mode, setMode] = useState<ScanMode>("camera");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageScanStatus, setImageScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [imageScanMessage, setImageScanMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseToken = (raw: string): string => {
    try {
      if (raw.startsWith("http")) {
        const url = new URL(raw);
        return url.searchParams.get("token") || url.searchParams.get("code") || raw;
      }
    } catch {
      // not a URL
    }
    return raw;
  };

  // ── Daftar Kamera ───────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function listCameras() {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        const list = await QrScanner.listCameras(true);
        if (isMounted) {
          setCameras(list.map((c) => ({ id: c.id, label: c.label })));
          // Prioritas kamera belakang HP
          const rear = list.find((c) =>
            /back|rear|environment/i.test(c.label)
          );
          setSelectedCamera(rear?.id || list[0]?.id || "");
        }
      } catch {
        // izin kamera belum diberikan — daftar kosong, tidak masalah
      }
    }

    listCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper untuk menghentikan seluruh MediaStreamTrack (agar lampu/hardware kamera langsung mati)
  const stopMediaTracks = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
  }, []);

  // Ensure camera tracks are closed when component unmounts
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      stopMediaTracks();
    };
  }, [stopMediaTracks]);

  // ── Mulai / Hentikan Kamera ──────────
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    let isCancelled = false;

    async function startScanner() {
      const { default: QrScanner } = await import("qr-scanner");

      if (isCancelled || !videoRef.current) return;

      setCameraError(null);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          const token = parseToken(result.data);
          scanner.stop();
          scanner.destroy();
          scannerRef.current = null;
          stopMediaTracks();
          setIsCameraActive(false);
          onScanSuccess(token);
        },
        {
          preferredCamera: selectedCamera || "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      try {
        await scanner.start();
        scannerRef.current = scanner;
      } catch (_err) {
        setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.");
        setIsCameraActive(false);
        scanner.destroy();
        stopMediaTracks();
      }
    }

    startScanner();

    return () => {
      isCancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      stopMediaTracks();
    };
  }, [isCameraActive, selectedCamera, onScanSuccess, stopMediaTracks]);

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    stopMediaTracks();
    setIsCameraActive(false);
    setCameraError(null);
  }, [stopMediaTracks]);


  // ── Scan Gambar dari File
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageScanStatus("scanning");
    setImageScanMessage(null);

    try {
      const { default: QrScanner } = await import("qr-scanner");
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      const token = parseToken(result.data);
      setImageScanStatus("success");
      setImageScanMessage(`QR Code berhasil dibaca!`);
      onScanSuccess(token);
    } catch {
      setImageScanStatus("error");
      setImageScanMessage("QR Code tidak ditemukan pada gambar ini. Pastikan QR Code terlihat jelas dan tidak buram.");
    }
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageScanStatus("idle");
    setImageScanMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Pemindai QR Code
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gunakan kamera atau upload foto stiker QR yang ada di pintu/dinding rumah warga.
          </p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode("camera"); stopCamera(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            mode === "camera"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Kamera Langsung</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode("image"); stopCamera(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            mode === "image"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ImageUp className="w-3.5 h-3.5" />
          <span>Upload Foto QR</span>
        </button>
      </div>

      {/* ── MODE: KAMERA LIVE ───────────────────────────────────────────────── */}
      {mode === "camera" && (
        <div className="space-y-4">
          {!isCameraActive ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Kamera Belum Aktif</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Klik tombol di bawah untuk membuka pemindai kamera dan arahkan ke stiker QR.
                </p>
              </div>

              {/* Pilih kamera jika ada lebih dari satu */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Pilih Kamera:</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>{cam.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {cameraError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsCameraActive(true)}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Pemindai Kamera</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video element kamera */}
              <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scan frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 border-2 border-blue-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/80 font-semibold">
                  Arahkan ke QR Code
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
                >
                  <CameraOff className="w-4 h-4" />
                  <span>Matikan Kamera</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE: UPLOAD GAMBAR QR ──────────────────────────────────────────── */}
      {mode === "image" && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all space-y-4 text-center cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 flex items-center justify-center mx-auto transition">
                <ImageUp className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Pilih Foto QR Code</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Pilih foto stiker QR Code dari galeri HP atau file di perangkat Anda.
                </p>
              </div>
              <span className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-sm group-hover:bg-blue-700 transition">
                Pilih Gambar
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview gambar */}
              <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <Image
                  src={imagePreview!}
                  alt="Preview QR Code"
                  width={400}
                  height={256}
                  className="w-full object-contain max-h-64 h-auto"
                  unoptimized
                />
                {imageScanStatus === "scanning" && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>

              {/* Status scan gambar */}
              {imageScanStatus === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{imageScanMessage}</span>
                </div>
              )}
              {imageScanStatus === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{imageScanMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetImage}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
                >
                  <ImageUp className="w-4 h-4" />
                  <span>Ganti Gambar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
