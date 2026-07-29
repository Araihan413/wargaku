import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Menu, X } from "lucide-react";
import { SystemSettingsData } from "@/app/dashboard/system-config/types";
import WargakuText from '@/public/logo/wargakuTeks.webp'
import Logo from '@/public/logo/logo.webp'

interface PublicHeaderNavbarProps {
  settings: SystemSettingsData;
}

export const PublicHeaderNavbar: React.FC<PublicHeaderNavbarProps> = ({ settings }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
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
            <span className="text-center text-[8px] font-semibold text-slate-700">Sistem Manajemen Warga</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-700">
          <a
            href="#beranda"
            className="text-primary font-bold border-b-2 border-primary pb-1 transition-all"
          >
            Beranda
          </a>
          <a
            href="#pengumuman"
            className="hover:text-primary transition-colors pb-1"
          >
            Pengumuman
          </a>
          <a
            href="#transparansi-kas"
            className="hover:text-primary transition-colors pb-1"
          >
            Transparansi Kas
          </a>
          <Link
            href="/lapor"
            className="flex items-center gap-1 hover:text-primary transition-colors pb-1"
          >
            Lapor Pengaduan
          </Link>

          <Link
            href="/dashboard/qr-codes"
            className="flex items-center gap-1 hover:text-primary transition-colors pb-1"
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white p-4 space-y-3 animate-in fade-in">
          <nav className="flex flex-col gap-2.5 text-sm font-bold text-slate-700">
            <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Beranda
            </a>
            <a href="#pengumuman" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Pengumuman
            </a>
            <a href="#transparansi-kas" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Transparansi Kas
            </a>
            <Link href="/lapor" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Lapor Pengaduan Warga
            </Link>
            <Link href="/dashboard/qr-codes" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Scan QR Rumah
            </Link>
          </nav>
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
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
