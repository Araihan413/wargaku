import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

export type QrTemplateType = "a4_poster" | "mini_sticker" | "desk_standee";

export interface QrCodePrintCanvasProps {
  title: string;
  subtitle?: string;
  qrUrl: string;
  template?: QrTemplateType;
  className?: string;
  dwellingLabel?: string;
  id?: string;
}

export const QrCodePrintCanvas: React.FC<QrCodePrintCanvasProps> = ({
  title,
  subtitle,
  qrUrl,
  template = "a4_poster",
  className = "",
  dwellingLabel,
  id,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (qrUrl) {
      QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [qrUrl]);

  // ─── TEMPLATE 1: MINI STICKER (Stiker Pintu 8x10 cm) ──────────────────────────
  if (template === "mini_sticker") {
    return (
      <div
        id={id}
        className={`w-full max-w-75 bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col items-center justify-between text-center font-sans print:shadow-none print:border-slate-900 print:w-full print:max-w-[9cm] print:h-auto ${className}`}
      >
        {/* Header: Title & Subtitle Only */}
        <div className="space-y-1 w-full border-b pb-3 border-slate-200">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-2">
            {title || "STIKER QR CODE HUNIAN"}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-slate-600 font-medium leading-tight line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* QR Code Section */}
        <div className="py-2 flex flex-col items-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="QR Code Hunian"
                width={180}
                height={180}
                className="w-40 h-40 object-contain"
                unoptimized
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400 font-medium">
                Memuat QR...
              </div>
            )}
          </div>
        </div>

        {/* Dwelling Label / Footer */}
        <div className="w-full pt-2 border-t border-slate-200 px-2">
          <p className="text-xs font-extrabold text-blue-800 tracking-tight truncate" title={dwellingLabel}>
            {dwellingLabel || "Pindai QR untuk Informasi Hunian"}
          </p>
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 2: DESK STANDEE (Medium Display 12x18 cm) ────────────────────
  if (template === "desk_standee") {
    return (
      <div
        id={id}
        className={`w-full max-w-90 bg-white border-2 border-blue-900 rounded-3xl p-5 shadow-md flex flex-col items-center justify-between text-center font-sans space-y-3.5 print:shadow-none print:border-blue-900 print:w-full print:max-w-[9.5cm] print:h-auto ${className}`}
      >
        {/* Header: Title & Subtitle Only */}
        <div className="space-y-1.5 w-full border-b pb-3 border-slate-200">
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight leading-snug">
            {title || "STIKER QR CODE HUNIAN"}
          </h2>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* QR Code Container */}
        <div className="p-2.5 bg-blue-50/50 rounded-2xl border-2 border-blue-200 shadow-inner">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="QR Code Hunian"
              width={200}
              height={200}
              className="w-44 h-44 object-contain rounded-lg"
              unoptimized
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400 font-medium">
              Memuat QR...
            </div>
          )}
        </div>

        {/* Dwelling Label / Footer */}
        <div className="w-full pt-2.5 border-t border-slate-200 px-2">
          <p className="text-xs font-extrabold text-blue-900 tracking-wider truncate" title={dwellingLabel}>
            {dwellingLabel || "Pindai Menggunakan Kamera HP"}
          </p>
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 3 (DEFAULT): POSTER FULL A4 ──────────────────────────────────
  return (
    <div
      id={id}
      className={`w-full max-w-148.75 bg-white border border-slate-300 rounded-3xl p-8 shadow-md flex flex-col justify-between text-slate-900 font-sans space-y-6 print:shadow-none print:border-none print:w-full print:max-w-none print:p-8 print:rounded-none ${className}`}
    >
      {/* Header: Title & Subtitle Only */}
      <div className="text-center space-y-2 pb-6 border-b-2 border-slate-900">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase leading-snug">
          {title || "STIKER QR CODE HUNIAN"}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Center QR Code Section */}
      <div className="flex flex-col items-center justify-center my-4">
        <div className="p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-sm flex flex-col items-center">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="QR Code Hunian"
              width={260}
              height={260}
              className="w-64 h-64 object-contain rounded-xl"
              unoptimized
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
              Memuat QR Code...
            </div>
          )}
        </div>
        {dwellingLabel && (
          <div className="mt-4 text-center max-w-full px-4">
            <span className="inline-block max-w-full px-4 py-1.5 bg-blue-100 text-blue-900 rounded-full text-xs font-extrabold tracking-wider truncate" title={dwellingLabel}>
              {dwellingLabel}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="pt-4 border-t border-slate-200 text-center">
        <p className="text-xs font-extrabold text-slate-800 tracking-wider">
          Arahkan Kamera HP Ke Gambar QR Code Ini Untuk Pindai
        </p>
      </div>
    </div>
  );
};
