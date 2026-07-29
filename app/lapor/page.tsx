"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Copy,
  Phone,
  Upload,
  X,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Check,
  RefreshCw,
  Home,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface TrackedComplaint {
  id: number;
  trackingCode: string;
  reporterName: string;
  category: string;
  description: string;
  photoPath: string | null;
  status: "menunggu" | "proses" | "selesai" | "ditolak";
  responseNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  handlerName: string | null;
}

export default function PublicLaporPage() {
  const [activeTab, setActiveTab] = useState<"lapor" | "tracking">("lapor");

  // Form State
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [category, setCategory] = useState("Infrastruktur");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [createdTrackingCode, setCreatedTrackingCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Tracking Search State
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trackedData, setTrackedData] = useState<TrackedComplaint | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "Infrastruktur", label: "Infrastruktur (Jalan, Lampu, Fasum)" },
    { value: "Kebersihan", label: "Kebersihan (Sampah, Selokan)" },
    { value: "Keamanan", label: "Keamanan (Ronda, Lingkungan)" },
    { value: "Sosial", label: "Sosial & Kesejahteraan Warga" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reporterName.trim() || !reporterPhone.trim() || !description.trim()) {
      toast.error("Mohon lengkapi semua kolom wajib");
      return;
    }

    setIsSubmitting(true);
    let uploadedPhotoUrl: string | null = null;

    try {
      // 1. Upload photo if selected
      if (photoFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("folder", "complaints");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Gagal mengunggah foto lampiran");
        }

        const uploadJson = await uploadRes.json();
        uploadedPhotoUrl = uploadJson.url || uploadJson.secure_url;
      }

      // 2. Post complaint
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: reporterName.trim(),
          reporterPhone: reporterPhone.trim(),
          category,
          description: description.trim(),
          photoPath: uploadedPhotoUrl,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setCreatedTrackingCode(json.data.trackingCode);
        toast.success("Laporan berhasil dikirim!");
        // Reset form
        setReporterName("");
        setReporterPhone("");
        setCategory("Infrastruktur");
        setDescription("");
        handleRemovePhoto();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengirim laporan");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdTrackingCode) {
      navigator.clipboard.writeText(createdTrackingCode);
      setIsCopied(true);
      toast.success("Kode tracking berhasil disalin!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setTrackedData(null);

    try {
      const res = await fetch(`/api/complaints/track?code=${encodeURIComponent(searchCode.trim().toUpperCase())}`);
      if (res.ok) {
        const json = await res.json();
        setTrackedData(json.data);
      } else {
        const err = await res.json();
        setSearchError(err.error || "Laporan tidak ditemukan");
      }
    } catch (error) {
      console.error(error);
      setSearchError("Terjadi kesalahan jaringan");
    } finally {
      setIsSearching(false);
    }
  };

  const getStepStatusClass = (status: TrackedComplaint["status"], targetStep: "menunggu" | "proses" | "selesai") => {
    if (status === "ditolak") {
      return "bg-rose-500 text-white border-rose-600";
    }

    const order = ["menunggu", "proses", "selesai"];
    const currentIndex = order.indexOf(status);
    const targetIndex = order.indexOf(targetStep);

    if (currentIndex >= targetIndex) {
      return "bg-primary text-white border-primary";
    }
    return "bg-gray-sidebar-hover text-gray-placeholder border-gray-border";
  };

  return (
    <div className="min-h-screen bg-gray-page-bg py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-heading-main hover:text-primary transition"
          >
            <Home className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <span className="text-xs font-bold text-gray-secondary-text">
            Sistem Informasi Wargaku RT
          </span>
        </div>

        {/* Banner Header */}
        <div className="rounded-3xl border border-gray-border bg-linear-to-r from-primary-900 to-primary p-6 sm:p-8 text-white shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Laporan & Pengaduan Warga</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lapor Layanan & Masalah RT
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Sampaikan laporan aduan lingkungan Anda secara aman. Pengurus RT akan meninjau dan menindaklanjuti secara cepat.
          </p>

          {/* Navigation Tabs */}
          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("lapor")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "lapor"
                  ? "bg-white text-primary shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Buat Laporan Baru
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "tracking"
                  ? "bg-white text-primary shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Cek Status Laporan
            </button>
          </div>
        </div>

        {/* TAB 1: FORM LAPOR BARU */}
        {activeTab === "lapor" && (
          <div className="rounded-3xl border border-gray-border bg-gray-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-gray-border pb-4">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-heading-main">
                  Formulir Pengaduan Publik
                </h2>
                <p className="text-xs text-gray-secondary-text">
                  Isi data laporan dengan jujur dan sertakan foto lokasi jika ada.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-5">
              {/* Nama Pelapor */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nama Lengkap Pelapor <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda..."
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Nomor Telepon / WA */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nomor WhatsApp / Telepon <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-placeholder" />
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Kategori Aduan */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Kategori Pengaduan <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                />
              </div>

              {/* Deskripsi Laporan */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Rincian Deskripsi Laporan <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan kronologi, lokasi kejadian, atau permasalahan secara detail..."
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  required
                />
              </div>

              {/* Unggah Foto Pendukung */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Foto Bukti Lampiran (Opsional)
                </label>
                {photoPreview ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-gray-border bg-gray-page-bg">
                    <Image
                      src={photoPreview}
                      alt="Preview Lampiran"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-border bg-gray-page-bg hover:border-primary/50 transition cursor-pointer text-center">
                    <Upload className="h-7 w-7 text-gray-placeholder mb-2" />
                    <span className="text-xs font-bold text-gray-heading-main">
                      Klik untuk Unggah Foto Bukti
                    </span>
                    <span className="text-[11px] text-gray-secondary-text mt-0.5">
                      Format: JPG, PNG, WebP (Maks 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-extrabold text-sm shadow-md hover:bg-primary-900 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isUploading ? "Mengunggah Foto..." : "Mengirim Laporan..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim Laporan Pengaduan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: CEK STATUS TRACKING */}
        {activeTab === "tracking" && (
          <div className="rounded-3xl border border-gray-border bg-gray-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-gray-border pb-4">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-heading-main">
                  Lacak Status Pengaduan Warga
                </h2>
                <p className="text-xs text-gray-secondary-text">
                  Masukkan Kode Tracking yang Anda dapatkan saat mengirim laporan.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleTrackSearch} className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Masukkan Kode Tracking (contoh: LAP-2026-001)..."
                className="flex-1 bg-gray-card border border-gray-border rounded-xl px-4 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono uppercase"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:bg-primary-900 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>Lacak</span>
              </button>
            </form>

            {/* Search Error */}
            {searchError && (
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-600 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Tracked Result Details */}
            {trackedData && (
              <div className="space-y-6 pt-2">
                {/* Stepper Status */}
                <div className="p-6 rounded-2xl border border-gray-border bg-gray-page-bg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-secondary-text uppercase tracking-wider">
                      Status Penanganan
                    </span>
                    <span className="font-mono text-xs font-extrabold text-primary">
                      #{trackedData.trackingCode}
                    </span>
                  </div>

                  {/* Visual Stepper */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(trackedData.status, "menunggu")}`}>
                        1
                      </div>
                      <span className="text-[11px] font-bold text-gray-heading-main">Menunggu</span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(trackedData.status, "proses")}`}>
                        2
                      </div>
                      <span className="text-[11px] font-bold text-gray-heading-main">Diproses</span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(trackedData.status, "selesai")}`}>
                        3
                      </div>
                      <span className="text-[11px] font-bold text-gray-heading-main">
                        {trackedData.status === "ditolak" ? "Ditolak" : "Selesai"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details & Response Note */}
                <div className="space-y-4 p-5 rounded-2xl border border-gray-border bg-gray-card">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-secondary-text font-medium">Pelapor:</span>
                      <p className="font-bold text-gray-heading-main">{trackedData.reporterName}</p>
                    </div>
                    <div>
                      <span className="text-gray-secondary-text font-medium">Kategori:</span>
                      <p className="font-bold text-primary">{trackedData.category}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-gray-secondary-text">Deskripsi Aduan:</span>
                    <p className="text-xs text-gray-heading-main bg-gray-page-bg p-3 rounded-xl border border-gray-border/60 mt-1 whitespace-pre-wrap">
                      {trackedData.description}
                    </p>
                  </div>

                  {trackedData.responseNote && (
                    <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/60 space-y-1 text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tanggapan Pengurus RT:</span>
                      </span>
                      <p className="text-emerald-900 italic pl-5">
                        &quot;{trackedData.responseNote}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUCCESS MODAL FOR NEW REPORT */}
      {createdTrackingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gray-card border border-gray-border rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-heading-main">
                Laporan Berhasil Terkirim!
              </h3>
              <p className="text-xs text-gray-secondary-text mt-1">
                Simpan Kode Tracking ini untuk memantau status tindak lanjut pengaduan Anda.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="p-4 rounded-2xl border border-gray-border bg-gray-page-bg space-y-2">
              <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                Kode Tracking Pengaduan
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-extrabold text-primary">
                  {createdTrackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg border border-gray-border bg-gray-card text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
                  title="Salin Kode"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo, saya telah mengirimkan laporan pengaduan RT Wargaku dengan Kode Tracking: ${createdTrackingCode}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition"
              >
                <span>Simpan ke WhatsApp</span>
                <ChevronRight className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setCreatedTrackingCode(null);
                  setActiveTab("tracking");
                  setSearchCode(createdTrackingCode);
                }}
                className="w-full py-2.5 rounded-xl border border-gray-border bg-gray-card text-gray-heading-main font-bold text-xs hover:bg-gray-sidebar-hover transition cursor-pointer"
              >
                Tutup & Lacak Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
