"use client";

import React, { useState } from "react";
import { Link2, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
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
  const [customUrl, setCustomUrl] = useState<string>(() => {
    if (typeof window === "undefined") return "https://wargaku.app";
    try {
      const saved = localStorage.getItem("wargaku_qr_custom_url");
      if (saved) return saved;
    } catch {
      // ignore
    }
    return "https://wargaku.app";
  });

  const handleUrlChange = (val: string) => {
    setCustomUrl(val);
    try {
      localStorage.setItem("wargaku_qr_custom_url", val);
    } catch (e) {
      console.error("Error saving custom QR URL to localStorage:", e);
    }
  };

  const cleanUrl = customUrl.trim() || "https://wargaku.app";

  const handleDownloadPng = async () => {
    try {
      const el = document.getElementById("custom-qr-sticker-card");
      if (el) {
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2 });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `Stiker_QR_Custom_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Stiker QR Code custom berhasil diunduh.");
        return;
      }

      // Fallback
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
      toast.error("Gagal mengunduh stiker QR Code.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
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
            <label className="text-sm font-semibold text-black/80 tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-purple-600" />
              <span>Link / URL Custom</span>
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
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

        {/* Live Preview Container */}
        <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
          <span className="text-xs font-bold text-slate-600 mb-3">Pratinjau Stiker Custom:</span>
          <QrCodePrintCanvas
            id="custom-qr-sticker-card"
            title={title || "INFORMASI DOKUMEN RESMI"}
            subtitle={subtitle}
            qrUrl={cleanUrl}
            template={template}
            dwellingLabel={cleanUrl}
          />
        </div>
      </div>

      {/* PRINT CONTAINER FOR CUSTOM QR */}
      <div className="hidden print:flex justify-center p-4">
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
