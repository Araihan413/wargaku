"use client";

import React, { useState } from "react";
import {
  X,
  MessageSquare,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Maximize2,
} from "lucide-react";
import { ComplaintItem } from "../types";
import { CustomSelect } from "@/components/CustomSelect";
import Image from "next/image";
import { toast } from "sonner";

interface ComplaintDetailModalProps {
  complaint: ComplaintItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface ModalContentProps {
  complaint: ComplaintItem;
  onClose: () => void;
  onRefresh: () => void;
}

const ComplaintDetailModalContent: React.FC<ModalContentProps> = ({
  complaint,
  onClose,
  onRefresh,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(complaint.status);
  const [responseNote, setResponseNote] = useState<string>(complaint.responseNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoomImageOpen, setIsZoomImageOpen] = useState(false);
  const [selectedZoomUrl, setSelectedZoomUrl] = useState<string | null>(null);

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const waNumber = complaint.reporterPhone
    ? complaint.reporterPhone.replace(/[^0-9]/g, "").replace(/^0/, "62")
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus) {
      toast.error("Pilih status tanggapan terlebih dahulu");
      return;
    }

    if ((selectedStatus === "selesai" || selectedStatus === "ditolak") && !responseNote.trim()) {
      toast.error("Catatan tanggapan / alasan wajib diisi sebelum menyelesaikan atau menolak aduan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          responseNote: responseNote.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Status & tanggapan pengaduan berhasil diperbarui");
        onRefresh();
        onClose();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal memperbarui pengaduan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "menunggu", label: "Menunggu Respon" },
    { value: "proses", label: "Sedang Diproses (Proses)" },
    { value: "selesai", label: "Selesai Ditangani (Selesai)" },
    { value: "ditolak", label: "Ditolak" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-gray-card border border-gray-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border bg-gray-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-heading-main">
                Detail Pengaduan Warga
              </h2>
              <span className="font-mono text-xs font-bold text-primary">
                #{complaint.trackingCode}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-secondary-text hover:bg-gray-sidebar-hover transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container wrapping scrollable body and fixed footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* DIRECT PHOTO PREVIEW DISPLAY AT THE VERY TOP */}
            {(() => {
              let photoUrls: string[] = [];
              if (complaint.photoPath) {
                try {
                  if (complaint.photoPath.startsWith("[")) {
                    const parsed = JSON.parse(complaint.photoPath);
                    photoUrls = Array.isArray(parsed) ? parsed : [complaint.photoPath];
                  } else {
                    photoUrls = [complaint.photoPath];
                  }
                } catch {
                  photoUrls = [complaint.photoPath];
                }
              }

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-secondary-text">
                      Foto Bukti Lampiran ({photoUrls.length} Foto)
                    </label>
                  </div>

                  {photoUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {photoUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-gray-border bg-gray-page-bg shadow-xs group cursor-pointer"
                          onClick={() => {
                            setSelectedZoomUrl(url);
                            setIsZoomImageOpen(true);
                          }}
                        >
                          <Image
                            src={url}
                            alt={`Foto Bukti ${idx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-gray-border bg-gray-page-bg/50 text-gray-secondary-text text-center">
                      <ImageIcon className="h-8 w-8 text-gray-placeholder mb-2" />
                      <span className="text-xs font-medium">
                        Warga tidak mengunggah lampiran foto bukti.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Reporter & Complaint Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-gray-border bg-gray-page-bg/40">
              <div>
                <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Nama Pelapor
                </span>
                <p className="text-sm font-extrabold text-gray-heading-main mt-0.5">
                  {complaint.reporterName}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Kontak Telepon / WA
                </span>
                {complaint.reporterPhone ? (
                  <div className="mt-0.5">
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-600 hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{complaint.reporterPhone}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-placeholder mt-0.5">-</p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Kategori Laporan
                </span>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {complaint.category}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                  Waktu Pelaporan
                </span>
                <p className="text-xs font-bold text-gray-heading-main mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-secondary-text" />
                  <span>{formattedDate}</span>
                </p>
              </div>

              {complaint.dwellingAddress && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-bold text-gray-secondary-text uppercase tracking-wider">
                    Lokasi Rumah / Hunian
                  </span>
                  <p className="text-xs font-bold text-gray-heading-main mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>{complaint.dwellingAddress}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-secondary-text">
                Isi Deskripsi Laporan
              </label>
              <div className="p-4 rounded-2xl border border-gray-border bg-gray-card text-sm text-gray-heading-main leading-relaxed font-normal whitespace-pre-wrap">
                {complaint.description}
              </div>
            </div>

            {/* History of Previous Handling if exists */}
            {complaint.handlerName && (
              <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ditangani Oleh: {complaint.handlerName}</span>
                </div>
                {complaint.responseNote && (
                  <p className="text-xs text-sky-900 italic pl-5">
                    &quot;{complaint.responseNote}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Form Pemrosesan / Tanggapan Pengurus */}
            <div className="pt-2 border-t border-gray-border space-y-4">
              <h3 className="text-sm font-extrabold text-gray-heading-main flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>Form Tanggapan & Pemrosesan Pengurus</span>
              </h3>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Ubah Status Laporan <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CustomSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  placeholder="Pilih Status Tanggapan"
                />
              </div>

              {/* Response Note Input */}
              <div>
                <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
                  Catatan Tanggapan / Alasan
                  {(selectedStatus === "selesai" || selectedStatus === "ditolak") && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="Tuliskan catatan tindak lanjut atau alasan penolakan untuk warga..."
                  className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main placeholder:text-gray-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer Buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-border bg-gray-card shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-border bg-gray-card text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:bg-primary-900 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Tanggapan"}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Zoom Modal if User Clicks Zoom */}
      {isZoomImageOpen && selectedZoomUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => {
            setIsZoomImageOpen(false);
            setSelectedZoomUrl(null);
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedZoomUrl}
              alt="Foto Bukti Resolusi Penuh"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setIsZoomImageOpen(false);
                setSelectedZoomUrl(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen || !complaint) return null;

  return (
    <ComplaintDetailModalContent
      key={complaint.id}
      complaint={complaint}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
};
