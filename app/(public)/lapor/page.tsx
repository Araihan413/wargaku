"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Copy,
  Phone,
  Upload,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { CustomSelect } from "@/components/CustomSelect";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { Turnstile } from "@marsidev/react-turnstile";

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
  const [photos, setPhotos] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Success Modal State
  const [createdTrackingCode, setCreatedTrackingCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Tracking Search State
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trackedData, setTrackedData] = useState<TrackedComplaint | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const categoryOptions = [
    { value: "Infrastruktur", label: "Infrastruktur (Jalan, Lampu, Fasum)" },
    { value: "Kebersihan", label: "Kebersihan (Sampah, Selokan)" },
    { value: "Keamanan", label: "Keamanan (Ronda, Lingkungan)" },
    { value: "Sosial", label: "Sosial & Kesejahteraan Warga" },
    { value: "Lainnya", label: "Lainnya" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (photos.length + selectedFiles.length > 5) {
      toast.error("Maksimal 5 foto bukti lampiran yang diperbolehkan.");
    }

    const availableSlots = 5 - photos.length;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    const newItems: Array<{ file: File; previewUrl: string }> = [];

    for (const file of filesToAdd) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi batas 5MB.`);
        continue;
      }
      newItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotos((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllPhotos = () => {
    photos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPhotos([]);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reporterName.trim() || !reporterPhone.trim() || !description.trim()) {
      toast.error("Mohon lengkapi semua kolom wajib");
      return;
    }

    if (!turnstileToken) {
      toast.error("Silakan selesaikan verifikasi CAPTCHA bot terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const uploadedPhotoUrls: string[] = [];

    try {
      // 1. Upload all photos to Cloudinary if selected
      if (photos.length > 0) {
        setIsUploading(true);
        for (const item of photos) {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("folder", "complaints");

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error("Gagal mengunggah foto lampiran");
          }

          const uploadJson = await uploadRes.json();
          const url = uploadJson.url || uploadJson.secure_url;
          if (url) uploadedPhotoUrls.push(url);
        }
      }

      // Serialize photo URLs to JSON string if > 1 or present
      const finalPhotoPath =
        uploadedPhotoUrls.length === 0
          ? null
          : uploadedPhotoUrls.length === 1
          ? uploadedPhotoUrls[0]
          : JSON.stringify(uploadedPhotoUrls);

      // 2. Post complaint
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: reporterName.trim(),
          reporterPhone: reporterPhone.trim(),
          category,
          description: description.trim(),
          photoPath: finalPhotoPath,
          turnstileToken,
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
        clearAllPhotos();
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
      const res = await fetch(
        `/api/complaints/track?code=${encodeURIComponent(searchCode.trim().toUpperCase())}`
      );
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

  const getStepStatusClass = (
    status: TrackedComplaint["status"],
    targetStep: "menunggu" | "proses" | "selesai"
  ) => {
    if (status === "ditolak") {
      return "bg-rose-500 text-white border-rose-600";
    }

    const order = ["menunggu", "proses", "selesai"];
    const currentIndex = order.indexOf(status);
    const targetIndex = order.indexOf(targetStep);

    if (currentIndex >= targetIndex) {
      return "bg-blue-600 text-white border-blue-600";
    }
    return "bg-slate-100 text-slate-400 border-slate-200";
  };

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={ShieldCheck}
        title="Layanan Pengaduan Warga"
        subtitle="Sampaikan aduan atau aspirasi lingkungan Anda. Pengurus RT akan meninjau dan menindaklanjuti secara cepat."
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-6 pb-12">
        {/* Navigation Tabs Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("lapor")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "lapor"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Buat Laporan Baru</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tracking")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "tracking"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Lacak Status Laporan</span>
          </button>
        </div>

        {/* TAB 1: FORM LAPOR BARU */}
        {activeTab === "lapor" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Formulir Pengaduan Publik
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Isi data laporan secara jelas dan lampirkan foto lokasi jika ada.
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all"
                  required
                />
              </div>

              {/* Nomor Telepon / WA */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Nomor WhatsApp / Telepon <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Kategori Aduan */}
              <div>
                <CustomSelect
                  label="Kategori Pengaduan"
                  required
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
                  required
                />
              </div>

              {/* Unggah Foto Pendukung (Shopee Review Style Grid - Max 5) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-black/80 tracking-wider">
                    Foto Bukti Lampiran <span className="text-xs text-slate-400 font-normal">(Opsional, Maksimal 5 Foto)</span>
                  </label>
                  <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {photos.length}/5 Foto
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Item Foto Terpilih */}
                  {photos.map((item, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 group shadow-xs hover:border-blue-400 transition"
                    >
                      <Image
                        src={item.previewUrl}
                        alt={`Foto Bukti ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 80px, 96px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition cursor-pointer"
                        title="Hapus Foto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Tombol Tambah Foto (Hanya tampil jika < 5 foto) */}
                  {photos.length < 5 && (
                    <label className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center shrink-0 group">
                      <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                        Tambah Foto
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  Ukuran ringkas hemat ruang. Format: JPG, PNG, WebP (Maks 5MB per foto).
                </p>
              </div>

              {/* Cloudflare Turnstile Anti-Spam Widget */}
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                <div className="flex justify-center my-4 overflow-hidden">
                  <Turnstile
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                  />
                </div>
              ) : null}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !turnstileToken}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-extrabold text-sm shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Lacak Status Pengaduan Warga
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Masukkan Kode Tracking yang Anda dapatkan saat mengirim laporan.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Masukkan Kode Tracking (contoh: LAP-2026-001)..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all font-mono uppercase"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold shadow-sm hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Lacak Status</span>
              </button>
            </form>

            {/* Search Error */}
            {searchError && (
              <PublicErrorState
                title="Laporan Tidak Ditemukan"
                message={searchError}
                onRetry={() => {
                  if (searchCode.trim()) {
                    const fakeEvent = { preventDefault: () => {} } as any;
                    handleTrackSearch(fakeEvent);
                  } else {
                    setSearchError(null);
                  }
                }}
                isLoading={isSearching}
              />
            )}

            {/* Tracked Result Details */}
            {trackedData && (
              <div className="space-y-6 pt-2">
                {/* Stepper Status */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status Penanganan Laporan
                    </span>
                    <span className="font-mono text-xs font-extrabold text-blue-600">
                      #{trackedData.trackingCode}
                    </span>
                  </div>

                  {/* Visual Stepper */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(
                          trackedData.status,
                          "menunggu"
                        )}`}
                      >
                        1
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">Menunggu</span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(
                          trackedData.status,
                          "proses"
                        )}`}
                      >
                        2
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">Diproses</span>
                    </div>

                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepStatusClass(
                          trackedData.status,
                          "selesai"
                        )}`}
                      >
                        3
                      </div>
                      <span className="text-[11px] font-bold text-slate-800">
                        {trackedData.status === "ditolak" ? "Ditolak" : "Selesai"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details & Response Note */}
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Pelapor:</span>
                      <p className="font-bold text-slate-900">{trackedData.reporterName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Kategori:</span>
                      <p className="font-bold text-blue-600">{trackedData.category}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-slate-400">Deskripsi Aduan:</span>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mt-1 whitespace-pre-wrap">
                      {trackedData.description}
                    </p>
                  </div>

                  {/* Foto Bukti Lampiran jika Ada */}
                  {(() => {
                    let urls: string[] = [];
                    if (trackedData.photoPath) {
                      try {
                        if (trackedData.photoPath.startsWith("[")) {
                          urls = JSON.parse(trackedData.photoPath);
                        } else {
                          urls = [trackedData.photoPath];
                        }
                      } catch {
                        urls = [trackedData.photoPath];
                      }
                    }
                    if (urls.length === 0) return null;
                    return (
                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-slate-400">
                          Foto Bukti Lampiran ({urls.length} Foto):
                        </span>
                        <div className="flex flex-wrap gap-2.5 pt-0.5">
                          {urls.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setZoomImageUrl(url)}
                              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 group hover:border-blue-500 transition cursor-pointer"
                            >
                              <Image
                                src={url}
                                alt={`Lampiran ${idx + 1}`}
                                fill
                                sizes="(max-width: 640px) 80px, 96px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {trackedData.responseNote && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1.5 text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tanggapan Resmi Pengurus RT:</span>
                      </span>
                      <p className="text-emerald-950 italic pl-5 font-medium">
                        &quot;{trackedData.responseNote}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SUCCESS MODAL FOR NEW REPORT */}
      {createdTrackingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Laporan Berhasil Terkirim!
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Simpan Kode Tracking ini untuk memantau status tindak lanjut pengaduan Anda.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kode Tracking Pengaduan
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-black text-blue-600">
                  {createdTrackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Salin Kode"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Kode Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-600" />
                    <span>Salin Info Pengaduan</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Halo, saya telah mengirimkan laporan pengaduan Wargaku.\n\nKode Tracking: *${createdTrackingCode}*\n\nGunakan kode ini di halaman "Cek Laporan" aplikasi Wargaku untuk memantau status tindak lanjut.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Simpan ke WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setCreatedTrackingCode(null);
                  setActiveTab("tracking");
                  setSearchCode(createdTrackingCode);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup & Lacak Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomImageUrl}
              alt="Foto Bukti Resolusi Penuh"
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
