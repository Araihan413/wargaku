"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Menu, X } from "lucide-react";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";
import WargakuText from "@/public/logo/wargakuTeks.webp";
import Logo from "@/public/logo/logo.webp";

interface PublicHeaderNavbarProps {
  settings: SystemSettingsData;
}

export const PublicHeaderNavbar: React.FC<PublicHeaderNavbarProps> = ({ settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isPengumuman = pathname?.startsWith("/pengumuman");
  const isKegiatan = pathname?.startsWith("/kegiatan");
  const isKas = pathname?.startsWith("/transparansi-kas");
  const isLapor = pathname?.startsWith("/lapor");
  const isQr = pathname?.startsWith("/scan-qr");

  const desktopActiveStyle = "text-primary font-bold border-b-2 border-primary pb-1 transition-all";
  const desktopInactiveStyle = "hover:text-primary transition-colors pb-1 text-slate-700 font-semibold";

  const mobileActiveStyle = "px-3 py-2 rounded-lg bg-primary/10 text-primary font-extrabold transition-colors";
  const mobileInactiveStyle = "px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 font-semibold";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1920] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="group flex items-center gap-2">
          {settings?.logoPath ? (
            <Image
              src={settings.logoPath}
              alt="Logo RT"
              width={40}
              height={40}
              className="w-10 object-contain group-hover:scale-105 transition-transform"
              unoptimized
            />
          ) : (
            <Image
              src={Logo}
              alt="Logo RT"
              width={40}
              height={40}
              className="w-10 object-contain group-hover:scale-105 transition-transform"
              unoptimized
            />
          )}
          <div className="flex flex-col gap-0.5 items-center">
            <Image
              src={WargakuText}
              alt="Logo RT"
              width={40}
              height={40}
              className="w-30 object-contain"
              unoptimized
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold">
          <Link
            href="/"
            className={isHome ? desktopActiveStyle : desktopInactiveStyle}
          >
            Beranda
          </Link>

          <Link
            href="/pengumuman"
            className={isPengumuman ? desktopActiveStyle : desktopInactiveStyle}
          >
            Pengumuman
          </Link>

          <Link
            href="/kegiatan"
            className={isKegiatan ? desktopActiveStyle : desktopInactiveStyle}
          >
            Kegiatan
          </Link>

          <Link
            href="/transparansi-kas"
            className={isKas ? desktopActiveStyle : desktopInactiveStyle}
          >
            Transparansi Kas
          </Link>

          <Link
            href="/lapor"
            className={isLapor ? desktopActiveStyle : desktopInactiveStyle}
          >
            Lapor Pengaduan
          </Link>

          <Link
            href="/scan-qr"
            className={isQr ? desktopActiveStyle : desktopInactiveStyle}
          >
            <span>Scan QR Rumah</span>
          </Link>
        </nav>

        {/* Right Button: Masuk */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Masuk</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          aria-label="Toggle mobile navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown (Absolute Positioning) */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 z-50">
          <nav className="flex flex-col gap-2.5 text-sm">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={isHome ? mobileActiveStyle : mobileInactiveStyle}
            >
              Beranda
            </Link>

            <Link
              href="/pengumuman"
              onClick={() => setMobileMenuOpen(false)}
              className={isPengumuman ? mobileActiveStyle : mobileInactiveStyle}
            >
              Pengumuman
            </Link>

            <Link
              href="/kegiatan"
              onClick={() => setMobileMenuOpen(false)}
              className={isKegiatan ? mobileActiveStyle : mobileInactiveStyle}
            >
              Agenda Kegiatan
            </Link>

            <Link
              href="/transparansi-kas"
              onClick={() => setMobileMenuOpen(false)}
              className={isKas ? mobileActiveStyle : mobileInactiveStyle}
            >
              Transparansi Kas
            </Link>

            <Link
              href="/lapor"
              onClick={() => setMobileMenuOpen(false)}
              className={isLapor ? mobileActiveStyle : mobileInactiveStyle}
            >
              Lapor Pengaduan Warga
            </Link>

            <Link
              href="/scan-qr"
              onClick={() => setMobileMenuOpen(false)}
              className={isQr ? mobileActiveStyle : mobileInactiveStyle}
            >
              Scan QR Rumah
            </Link>
          </nav>
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
