import React from "react";
import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";
import LogoTextPutih from "@/public/logo/LogoTextPutih.webp"
import Image from "next/image";

interface PublicContactFooterProps {
  settings: SystemSettingsData;
}

export const PublicContactFooter: React.FC<PublicContactFooterProps> = ({
  settings,
}) => {
  const addressText = settings?.secretariatAddress ||
    `${settings?.rtName || "RT -"} / ${settings?.rwName || "RW -"} ${settings?.villageName || "-"}, ${settings?.subdistrict || "-"}, ${settings?.city || "-"}`;

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-[1920] mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Col 1: Brand & Tagline (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <Link href="/" className="flex items-center gap-2 w-max ">
            <div className="w-max">
              <Image src={LogoTextPutih} alt="Logo Wargaku" className="w-40 h-auto" />
            </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
              Bersama membangun lingkungan RT yang tertib, aman dan transparan.
            </p>
          </div>

          {/* Col 2: Menu (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Menu
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/pengumuman" className="hover:text-white transition-colors">
                  Pengumuman
                </Link>
              </li>
              <li>
                <Link href="/kegiatan" className="hover:text-white transition-colors">
                  Kegiatan
                </Link>
              </li>
              <li>
                <Link href="/transparansi-kas" className="hover:text-white transition-colors">
                  Transparansi Kas
                </Link>
              </li>
              <li>
                <Link href="/lapor" className="hover:text-white transition-colors">
                  Lapor Aduan
                </Link>
              </li>
              <li>
                <Link href="/scan-qr" className="hover:text-white transition-colors">
                  Scan QR Rumah
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Pintasan (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pintasan
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Daftar Sebagai Warga
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Masuk Aplikasi
                </Link>
              </li>
              <li>
                <Link href="/lapor?tab=tracking" className="hover:text-white transition-colors">
                  Cek Status Akun / Aduan
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Kontak (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Kontak
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{addressText}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{settings?.officialEmail || "creativemu1922@gmail.com"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings?.officialRtPhone || "0812-3219-2245"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 font-medium">
          &copy; 2026 Creativemu. All Rights Reserved
        </div>
      </div>
    </footer>
  );
};
