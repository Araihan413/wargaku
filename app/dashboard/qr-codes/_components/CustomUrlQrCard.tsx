"use client";

import React, { useState } from "react";
import { Link2, Printer, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { QrTemplateType, QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";

interface CustomUrlQrCardProps {
  template: QrTemplateType;
  title: string;
  subtitle: string;
}

export const CustomUrlQrCard: React.FC<CustomUrlQrCardProps> = ({
  template,
  title,
  subtitle,
}) => {
  const [customUrl, setCustomUrl] = useState("https://wargaku.app");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
    setIsPreviewOpen(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            3. Buat QR Code dengan Link Custom
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Buat QR Code fleksibel dengan tautan/URL custom sesuai kebutuhan informasi atau pengumuman khusus.
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
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Pratinjau QR Custom</span>
          </button>

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

      {/* PREVIEW MODAL FOR CUSTOM QR */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Pratinjau QR Code Custom
              </h3>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <QrCodePrintCanvas
                title={title || "INFORMASI DOKUMEN RESMI"}
                subtitle={subtitle}
                qrUrl={cleanUrl}
                template={template}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak QR Custom</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
