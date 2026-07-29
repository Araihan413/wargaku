import React from "react";
import { Printer, Download, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { QrCodePrintCanvas } from "@/components/QrCodePrintCanvas";
import { QrConfigState, QrPageData } from "../types";

interface QrPreviewPrintContainerProps {
  config: QrConfigState;
  data: QrPageData;
  computedQrUrl: string;
}

export const QrPreviewPrintContainer: React.FC<QrPreviewPrintContainerProps> = ({
  config,
  data,
  computedQrUrl,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(computedQrUrl);
    setCopied(true);
    toast.success("Tautan QR berhasil disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = async () => {
    try {
      const url = await QRCode.toDataURL(computedQrUrl, { width: 800, margin: 2 });
      const a = document.createElement("a");
      a.href = url;
      const cleanTitle = (config.title || "qrcode").replace(/\s+/g, "_").toLowerCase();
      a.download = `QR_${cleanTitle}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("File gambar QR Code (PNG) berhasil diunduh.");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengunduh gambar QR Code.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Controls Header */}
      <div className="bg-gray-card border border-gray-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-heading-main">
          <Eye className="w-4 h-4 text-primary" />
          <span>Pratinjau Hasil Cetak Fisik</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-heading-main rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Tersalin!" : "Salin Link"}</span>
          </button>

          {/* Download PNG Button */}
          <button
            type="button"
            onClick={handleDownloadPng}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh (PNG)</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen / PDF</span>
          </button>
        </div>
      </div>

      {/* Live Preview Container (Clean printable area) */}
      <div className="flex justify-center p-6 bg-slate-100 border border-gray-border rounded-2xl print:p-0 print:border-none print:bg-transparent">
        <QrCodePrintCanvas
          title={config.title}
          subtitle={config.subtitle}
          qrUrl={computedQrUrl}
          logoUrl={data.systemSettings.logoPath}
          rtInfo={data.systemSettings}
          contactInfo={data.systemSettings}
          template={config.template}
          showContacts={config.showContacts}
          showLogo={config.showLogo}
        />
      </div>
    </div>
  );
};
