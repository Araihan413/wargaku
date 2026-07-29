import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Mail, Phone, QrCode as QrIcon } from "lucide-react";

export type QrTemplateType = "a4_poster" | "mini_sticker" | "desk_standee";

export interface QrCodePrintCanvasProps {
  title: string;
  subtitle?: string;
  qrUrl: string;
  logoUrl?: string | null;
  rtInfo?: {
    rtName: string;
    rwName: string;
    villageName: string;
    subdistrict: string;
    city: string;
    secretariatAddress?: string | null;
  } | null;
  contactInfo?: {
    officialEmail?: string | null;
    officialRtPhone?: string | null;
    officialSecretaryPhone?: string | null;
    officialTreasurerPhone?: string | null;
  } | null;
  template?: QrTemplateType;
  showContacts?: boolean;
  showLogo?: boolean;
  className?: string;
}

export const QrCodePrintCanvas: React.FC<QrCodePrintCanvasProps> = ({
  title,
  subtitle,
  qrUrl,
  logoUrl,
  rtInfo,
  contactInfo,
  template = "a4_poster",
  showContacts = true,
  showLogo = true,
  className = "",
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (qrUrl) {
      QRCode.toDataURL(qrUrl, {
        width: 500,
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

  const rtLabel = rtInfo
    ? `${rtInfo.rtName} / ${rtInfo.rwName}`
    : "RT 03 / RW 08";
  const areaLabel = rtInfo
    ? `${rtInfo.villageName}, ${rtInfo.subdistrict}, ${rtInfo.city}`
    : "Kelurahan Mulyorejo, Kota Surabaya";

  // ─── TEMPLATE 1: MINI STICKER (8x10 cm) ───────────────────────────
  if (template === "mini_sticker") {
    return (
      <div
        className={`w-full max-w-[320px] bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-md flex flex-col items-center justify-between text-center font-sans print:shadow-none print:border-slate-900 print:w-[8cm] print:h-[10cm] ${className}`}
      >
        {/* Header */}
        <div className="space-y-1 w-full border-b pb-3 border-slate-200">
          <div className="flex items-center justify-center gap-2">
            {showLogo && logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo RT"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
                unoptimized
              />
            ) : (
              <QrIcon className="w-5 h-5 text-slate-800" />
            )}
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {rtLabel}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-bold truncate">
            {areaLabel}
          </p>
        </div>

        {/* QR Code */}
        <div className="py-2 flex flex-col items-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="QR Code"
                width={180}
                height={180}
                className="w-40 h-40 object-contain"
                unoptimized
              />
            ) : (
              <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400">
                Memuat QR...
              </div>
            )}
          </div>
        </div>

        {/* Title / Instruction */}
        <div className="space-y-0.5 w-full pt-1 border-t border-slate-200">
          <h4 className="text-xs font-extrabold text-slate-900 tracking-tight line-clamp-2">
            {title}
          </h4>
          <span className="text-[9px] font-bold text-indigo-700 tracking-wider uppercase block">
            Pindai QR untuk Akses Publik
          </span>
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 2: DESK STANDEE (Meja Sekretariat) ─────────────────
  if (template === "desk_standee") {
    return (
      <div
        className={`w-full max-w-[380px] bg-white border-2 border-indigo-900 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between text-center font-sans space-y-4 print:shadow-none print:w-[12cm] print:h-[18cm] ${className}`}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-2 w-full border-b pb-4 border-indigo-100">
          {showLogo && logoUrl && (
            <Image
              src={logoUrl}
              alt="Logo RT"
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
              unoptimized
            />
          )}
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
              {rtLabel}
            </h3>
            <p className="text-[11px] font-medium text-slate-600">
              {areaLabel}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-600 font-medium leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* QR Code Container */}
        <div className="p-3 bg-indigo-50/50 rounded-2xl border-2 border-indigo-200 shadow-inner my-1">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={220}
              height={220}
              className="w-48 h-48 object-contain rounded-lg"
              unoptimized
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
              Memuat QR...
            </div>
          )}
        </div>

        {/* Footer Scan Info */}
        <div className="w-full pt-3 border-t border-indigo-100">
          <p className="text-[11px] font-extrabold text-indigo-900 tracking-wider uppercase">
            Pindai Menggunakan Kamera HP / Aplikasi WA
          </p>
          {contactInfo?.officialRtPhone && (
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              WA Official: {contactInfo.officialRtPhone}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── TEMPLATE 3 (DEFAULT): POSTER FULL A4 (Banner Display) ───────
  return (
    <div
      className={`w-full max-w-[595px] bg-white border border-slate-300 rounded-3xl p-8 shadow-xl flex flex-col justify-between text-slate-900 font-sans space-y-6 print:shadow-none print:border-none print:w-full print:max-w-none print:p-8 print:rounded-none ${className}`}
    >
      {/* 1. Kop Surat & Identitas RT */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
        <div className="flex items-center gap-4">
          {showLogo && logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo RT"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 text-white flex items-center justify-center font-black text-2xl">
              RT
            </div>
          )}
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
              RUKUN TETANGGA {rtInfo?.rtName || "03"} / RUKUN WARGA {rtInfo?.rwName || "08"}
            </h2>
            <p className="text-xs font-bold text-slate-700">
              {areaLabel}
            </p>
            {rtInfo?.secretariatAddress && (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Sekretariat: {rtInfo.secretariatAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Judul Utama Poster */}
      <div className="text-center space-y-2 py-2">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-extrabold tracking-wider uppercase">
          LAYANAN PUBLIK DIGITAL WARGAKU
        </span>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase leading-snug">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* 3. Center QR Code Section */}
      <div className="flex flex-col items-center justify-center my-2">
        <div className="p-4 bg-white rounded-3xl border-4 border-slate-900 shadow-lg flex flex-col items-center">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="QR Code Resmi RT"
              width={260}
              height={260}
              className="w-60 h-60 object-contain rounded-xl"
              unoptimized
            />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center text-xs text-slate-400">
              Memuat QR Code...
            </div>
          )}
        </div>
        <div className="mt-3 text-center space-y-1">
          <p className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">
            Arahkan Kamera HP / WA Ke Gambar QR Code Ini
          </p>
          {/* <p className="text-[11px] font-mono text-slate-500 max-w-md truncate">
            {qrUrl}
          </p> */}
        </div>
      </div>

      {/* 4. Footer Informasi Kontak Official */}
      {showContacts && contactInfo && (
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {contactInfo.officialRtPhone && (
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Ketua RT: <strong>{contactInfo.officialRtPhone}</strong></span>
            </div>
          )}
          {contactInfo.officialSecretaryPhone && (
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Sekretaris: <strong>{contactInfo.officialSecretaryPhone}</strong></span>
            </div>
          )}
          {contactInfo.officialTreasurerPhone && (
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Bendahara: <strong>{contactInfo.officialTreasurerPhone}</strong></span>
            </div>
          )}
          {contactInfo.officialEmail && (
            <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
              <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">Email: <strong>{contactInfo.officialEmail}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
