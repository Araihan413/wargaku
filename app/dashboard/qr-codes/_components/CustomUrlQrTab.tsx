"use client";

import React, { useState } from "react";
import { Link2, Printer, Download, Info } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { QrTemplateType, QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";

interface CustomUrlQrTabProps {
  template: QrTemplateType;
  title: string;
  subtitle: string;
}

export const CustomUrlQrTab: React.FC<CustomUrlQrTabProps> = ({
  template,
  title,
  subtitle,
}) => {
  const [customUrl, setCustomUrl] = useState("https://wargaku.app");
  const cleanUrl = customUrl.trim() || "https://wargaku.app";

  const handleDownloadPng = async () => {
    try {
      const url = await QRCode.toDataURL(cleanUrl, { width: 800, margin: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_Custom_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Gambar QR Code custom berhasil diunduh.");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh QR Code.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-800 font-medium print:hidden">
        <Info className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          Cetak atau unduh QR Code dengan link custom. Desain judul, subjudul, dan ukuran stiker secara otomatis mengikuti pengaturan dari <strong>Tab Pengaturan QR</strong>.
        </span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6 print:hidden">
        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Buat QR Code dengan Link Custom
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ketikkan tautan/URL custom sesuai kebutuhan pengumuman atau dokumen resmi RT yang ingin disebarkan.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-purple-600" />
              <span>Link / URL Custom</span>
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://contoh-link-pengumuman.com"
              className="w-full bg-gray-card border border-gray-border rounded-xl px-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak QR Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT CONTAINER FOR CUSTOM QR */}
      <div className="hidden print:block flex justify-center p-4">
        <QrCodePrintCanvas
          title={title || "INFORMASI DOKUMEN RESMI"}
          subtitle={subtitle}
          qrUrl={cleanUrl}
          template={template}
          dwellingLabel={cleanUrl}
        />
      </div>
    </div>
  );
};
