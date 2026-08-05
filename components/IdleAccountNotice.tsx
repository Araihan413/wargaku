import React from "react";
import Link from "next/link";
import { UserCheck, ShieldAlert, ArrowRight, User, Megaphone } from "lucide-react";

export interface IdleAccountNoticeProps {
  userName?: string;
}

export const IdleAccountNotice: React.FC<IdleAccountNoticeProps> = ({ userName }) => {
  return (
    <div className="max-w-3xl mx-auto my-8 p-6 sm:p-8 bg-gray-card border border-gray-border rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold tracking-wide">
            <UserCheck className="h-3.5 w-3.5" /> Status Akun: Aktif (Non-Penugasan)
          </div>

          <h2 className="text-xl font-bold text-gray-heading-main tracking-tight">
            Halo{userName ? `, ${userName}` : ""}, Akun Anda Saat Ini Dalam Kondisi Idle
          </h2>

          <p className="text-sm text-gray-secondary-text leading-relaxed">
            Saat ini Anda tidak sedang ditugaskan mengelola posisi jabatan pengurus RT maupun properti kos sewa manapun di lingkungan RT. Akun Anda **tetap aktif dan aman** di sistem.
          </p>

          <div className="p-4 rounded-xl bg-gray-sidebar-hover/40 border border-gray-border text-xs text-gray-secondary-text space-y-1.5">
            <p className="font-semibold text-gray-heading-main">💡 Informasi Penting:</p>
            <p>
              • Jika Ketua RT atau Pemilik Kos menunjuk Anda kembali di kemudian hari, akses operasional dashboard Anda akan **otomatis terbuka secara instan** tanpa perlu mendaftar ulang.
            </p>
            <p>
              • Anda tetap dapat mengelola profil pribadi atau melihat pengumuman dan transparansi kas di portal informasi publik RT.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
            >
              <User className="h-4 w-4" />
              Kelola Profil Saya
            </Link>

            <Link
              href="/pengumuman"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-border bg-gray-card text-gray-heading-main text-sm font-medium hover:bg-gray-sidebar-hover transition-all"
            >
              <Megaphone className="h-4 w-4 text-primary" />
              Portal Informasi Publik RT
              <ArrowRight className="h-3.5 w-3.5 text-gray-placeholder" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
