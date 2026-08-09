"use client";

import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import { toast } from "sonner";
import { MultiAttachmentInput, AttachmentItem } from "@/components/MultiAttachmentInput";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      toast.error("Judul dan tanggal pelaksanaan kegiatan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload any pending new files
      const uploadedAttachments: Array<{ name: string; url: string; type: "image" | "pdf" }> = [];

      for (const item of attachments) {
        if (item.file) {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("folder", "activities");

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error(`Gagal mengunggah berkas ${item.name}`);
          }

          const uploadJson = await uploadRes.json();
          const uploadedUrl = uploadJson.url || uploadJson.secure_url;
          uploadedAttachments.push({
            name: item.name,
            url: uploadedUrl,
            type: item.type,
          });
        } else if (item.url) {
          uploadedAttachments.push({
            name: item.name,
            url: item.url,
            type: item.type,
          });
        }
      }

      const finalAttachmentsJson =
        uploadedAttachments.length > 0 ? JSON.stringify(uploadedAttachments) : null;

      // 2. Post Activity
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          eventDate,
          location: location.trim(),
          attachments: finalAttachmentsJson,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan kegiatan RT");
      }

      toast.success("Kegiatan RT berhasil dijadwalkan");
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      setAttachments([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-gray-border bg-gray-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-heading-main">
                Tambah Agenda Kegiatan RT
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Jadwalkan rapat warga, kerja bakti, posyandu, atau acara sosial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-secondary-text hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Judul Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Nama Kegiatan RT<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Warga Triwulan III"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Tanggal & Waktu Pelaksanaan */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Waktu Pelaksanaan<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Lokasi Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Lokasi Kegiatan
            </label>
            <input
              type="text"
              placeholder="Contoh: Balai Warga / Pos Ronda RT 04"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Deskripsi & Rincian Acara
            </label>
            <textarea
              rows={4}
              placeholder="Tuliskan agenda pembahasan, perlengkapan yang perlu dibawa warga, dll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Multi Attachment Input */}
          <MultiAttachmentInput
            label="Lampiran Poster / Surat Edaran Resmi"
            maxFiles={3}
            items={attachments}
            onChange={setAttachments}
          />

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-border bg-gray-card px-4 py-2.5 text-xs font-bold text-gray-secondary-text hover:bg-gray-sidebar-hover transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-900 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Jadwalkan Kegiatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
