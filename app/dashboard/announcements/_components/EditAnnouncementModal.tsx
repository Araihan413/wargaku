"use client";

import React, { useState } from "react";
import { X, Megaphone, Pin } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { AnnouncementItem, AnnouncementCategory } from "../types";
import { toast } from "sonner";

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
  onSuccess: () => void;
}

export const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcement,
  onSuccess,
}) => {
  const [prevId, setPrevId] = useState<number | null>(announcement?.id ?? null);
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [category, setCategory] = useState<AnnouncementCategory>(announcement?.category || "umum");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state during render pass if selected announcement changes
  if (announcement && announcement.id !== prevId) {
    setPrevId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category);
  }

  if (!isOpen || !announcement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan isi pengumuman tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui pengumuman");
      }

      toast.success("Pengumuman berhasil diperbarui");
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
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-heading-main">
                Edit Pengumuman Warga
              </h3>
              <p className="text-xs text-gray-secondary-text mt-0.5">
                Perbarui rincian pengumuman yang sudah diterbitkan.
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
          {/* Judul Pengumuman */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Judul Pengumuman<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Kategori Pengumuman */}
          <div>
            <CustomSelect
              label="Kategori Pengumuman"
              required
              options={[
                { value: "umum", label: "Umum (Informasi Biasa)" },
                { value: "penting", label: "Penting (Perlu Perhatian Warga)" },
                { value: "mendesak", label: "Mendesak (Darurat / Segera)" },
              ]}
              value={category}
              onChange={(val) => setCategory(val as AnnouncementCategory)}
            />
          </div>

          {/* Isi Pengumuman */}
          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Isi Pengumuman<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

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
              {isSubmitting ? "Simpan Perubahan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
