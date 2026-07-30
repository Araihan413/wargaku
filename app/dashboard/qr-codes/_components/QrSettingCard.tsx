"use client";

import React from "react";
import { Settings, Layout, Type, FileText } from "lucide-react";
import { QrTemplateType } from "@/components/QrCodePrintCanvas";

interface QrSettingCardProps {
  template: QrTemplateType;
  title: string;
  subtitle: string;
  onTemplateChange: (t: QrTemplateType) => void;
  onTitleChange: (t: string) => void;
  onSubtitleChange: (s: string) => void;
}

export const QrSettingCard: React.FC<QrSettingCardProps> = ({
  template,
  title,
  subtitle,
  onTemplateChange,
  onTitleChange,
  onSubtitleChange,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            1. Pengaturan QR Code (Setting)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Atur ukuran fisik cetak, judul utama, dan subjudul yang akan tampil pada header stiker/poster QR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pilihan Ukuran / Template */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-blue-600" />
            <span>Ukuran / Format Cetak</span>
          </label>
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value as QrTemplateType)}
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
          >
            <option value="mini_sticker">Stiker Pintu / Mini (8 x 10 cm)</option>
            <option value="desk_standee">Standee Meja / Display (12 x 18 cm)</option>
            <option value="a4_poster">Poster Full A4 (Ukuran Besar)</option>
          </select>
        </div>

        {/* Input Judul */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
            <Type className="w-4 h-4 text-blue-600" />
            <span>Judul Header QR Code</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Contoh: STIKER PINTU RUMAH WARGA"
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
          />
        </div>

        {/* Input Subjudul */}
        <div className="space-y-1.5 md:col-span-3">
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Subjudul / Keterangan Tambahan</span>
          </label>
          <textarea
            rows={2}
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Contoh: Pindai QR code ini menggunakan kamera HP untuk memverifikasi identitas hunian warga."
            className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium"
          />
        </div>
      </div>
    </div>
  );
};
