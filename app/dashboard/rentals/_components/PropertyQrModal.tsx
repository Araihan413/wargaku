import React, { useState, useEffect } from "react";
import { X, QrCode as QrIcon, Download } from "lucide-react";
import { PropertyDetail } from "../types";
import QRCode from "qrcode";
import Image from "next/image";
import { getAppBaseUrl } from "@/lib/config";


interface PropertyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetail | null;
}

export const PropertyQrModal: React.FC<PropertyQrModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const qrToken = property?.qrToken || "";
  const origin = getAppBaseUrl();
  const qrUrl = qrToken ? `${origin}/scan-qr?token=${encodeURIComponent(qrToken)}` : "";


  useEffect(() => {
    let isCancelled = false;
    if (isOpen && property && qrUrl) {
      QRCode.toDataURL(qrUrl, { width: 400, margin: 2 })
        .then((url) => {
          if (!isCancelled) setQrDataUrl(url);
        })
        .catch((err) => console.error("Error generating QR code:", err));
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, property, qrUrl]);



  if (!isOpen || !property) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = qrDataUrl;
    downloadLink.download = `QR-${property.name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-border bg-gray-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-border pb-3">
          <div className="flex items-center gap-2">
            <QrIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-gray-heading-main">QR Code Fisik Properti</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-secondary-text hover:bg-gray-sidebar-hover cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-border rounded-xl space-y-3 shadow-inner">
          <div className="text-center space-y-0.5">
            <h4 className="text-sm font-extrabold text-slate-800">{property.name}</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Blok {property.blockNumber} No. {property.houseNumber}
            </p>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
            {qrDataUrl ? (
              <Image src={qrDataUrl} alt={`QR Code ${property.name}`} width={192} height={192} className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400 text-center px-4">
                {!qrToken ? "Token QR belum terbit untuk hunian ini" : "Memuat QR..."}
              </div>
            )}

          </div>

          <div className="text-center">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
              Scan untuk Informasi Kos / Cek Penghuni
            </span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-900 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Unduh QR (PNG)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-border text-xs font-semibold text-gray-heading-main hover:bg-gray-sidebar-hover transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
