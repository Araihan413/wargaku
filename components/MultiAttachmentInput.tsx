"use client";

import React from "react";
import { Upload, X, FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export interface AttachmentItem {
  name: string;
  url: string;
  type: "image" | "pdf";
  file?: File;
  previewUrl?: string;
}

interface MultiAttachmentInputProps {
  label?: string;
  maxFiles?: number;
  items: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
}

export const MultiAttachmentInput: React.FC<MultiAttachmentInputProps> = ({
  label = "Lampiran File / Dokumen (Maksimal 3 File)",
  maxFiles = 3,
  items,
  onChange,
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (items.length + selectedFiles.length > maxFiles) {
      toast.error(`Maksimal ${maxFiles} file lampiran yang diperbolehkan.`);
    }

    const availableSlots = maxFiles - items.length;
    const filesToAdd = selectedFiles.slice(0, availableSlots);

    const newItems: AttachmentItem[] = [];

    for (const file of filesToAdd) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} melebihi batas ukuran 5MB.`);
        continue;
      }

      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isImage = file.type.startsWith("image/");

      if (!isPdf && !isImage) {
        toast.error(`Format file ${file.name} tidak didukung. Hanya gambar dan PDF.`);
        continue;
      }

      newItems.push({
        name: file.name,
        url: "",
        type: isPdf ? "pdf" : "image",
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      });
    }

    onChange([...items, ...newItems]);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const target = items[index];
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-black/80 tracking-wider">
          {label}
        </label>
        <span className="text-xs font-bold font-mono text-gray-secondary-text bg-gray-page-bg px-2.5 py-0.5 rounded-md border border-gray-border">
          {items.length}/{maxFiles} File
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Render Existing / Selected Attachments */}
        {items.map((item, index) => {
          const isPdf = item.type === "pdf" || item.url.toLowerCase().includes(".pdf");

          return (
            <div
              key={index}
              className="relative flex items-center gap-2 p-2 rounded-xl border border-gray-border bg-gray-card shadow-xs shrink-0 group transition hover:border-primary"
            >
              {isPdf ? (
                <div className="flex items-center gap-2 pr-6">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="max-w-30 sm:max-w-37.5 overflow-hidden">
                    <p className="text-xs font-extrabold text-gray-heading-main truncate" title={item.name}>
                      {item.name || "Dokumen PDF"}
                    </p>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      Dokumen PDF
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-page-bg border border-gray-border shrink-0">
                  <Image
                    src={item.previewUrl || item.url || "/placeholder-image.png"}
                    alt={item.name || "Gambar Lampiran"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition" />
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-gray-card border border-gray-border text-gray-secondary-text hover:bg-rose-500 hover:text-white hover:border-rose-600 transition cursor-pointer"
                title="Hapus Lampiran"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Upload Trigger Button */}
        {items.length < maxFiles && (
          <label className="h-14 px-4 sm:h-16 rounded-xl border-2 border-dashed border-gray-border hover:border-primary bg-gray-page-bg/50 hover:bg-primary/5 flex items-center justify-center gap-2 cursor-pointer transition text-center shrink-0 group">
            <Upload className="h-4 w-4 text-gray-secondary-text group-hover:text-primary transition-colors" />
            <div className="text-left">
              <span className="block text-xs font-extrabold text-gray-heading-main group-hover:text-primary transition-colors">
                Tambah Lampiran
              </span>
              <span className="block text-[10px] text-gray-secondary-text">
                Gambar (JPG/PNG/WebP) / PDF (Maks 5MB)
              </span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};
