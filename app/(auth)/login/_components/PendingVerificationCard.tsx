"use client";

import React from "react";
import { Clock, ShieldAlert, ArrowLeft, CheckCircle2, User, Mail, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  name?: string;
  email?: string;
  nik?: string;
  phone?: string;
  familyNumber?: string;
}

interface PendingVerificationCardProps {
  user: PendingUser | null;
  onBackToLogin: () => void;
}

export function PendingVerificationCard({
  user,
  onBackToLogin,
}: PendingVerificationCardProps) {
  const handleContactSupport = () => {
    toast.info(
      "Silakan hubungi Ketua RT atau Sekretaris di sekretariat setempat untuk konfirmasi pendaftaran akun Anda."
    );
  };

  const maskNik = (nikStr?: string) => {
    if (!nikStr || nikStr.length < 6) return nikStr || "-";
    return `${nikStr.slice(0, 4)}**********${nikStr.slice(-2)}`;
  };

  return (
    <div className="w-full max-w-md bg-gray-card/80 backdrop-blur-xl border border-amber-500/30 p-8 rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header Icon & Status Badge */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl shadow-xs">
          <Clock className="h-8 w-8" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            Menunggu Verifikasi RT
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-gray-heading-main mt-2">
            Akun Belum Aktif
          </h2>
          <p className="text-xs text-gray-secondary-text mt-1 max-w-xs mx-auto">
            Pendaftaran mandiri Anda telah diterima dan sedang menunggu persetujuan Ketua RT/Sekretaris.
          </p>
        </div>
      </div>

      {/* User Information Card */}
      {user && (
        <div className="bg-gray-sidebar-hover/40 border border-gray-border rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gray-border/60">
            <span className="text-gray-secondary-text font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Nama Lengkap
            </span>
            <span className="font-semibold text-gray-heading-main">{user.name || "-"}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-gray-border/60">
            <span className="text-gray-secondary-text font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email
            </span>
            <span className="font-semibold text-gray-heading-main">{user.email || "-"}</span>
          </div>

          {user.nik && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-border/60">
              <span className="text-gray-secondary-text font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> NIK
              </span>
              <span className="font-mono text-gray-heading-main font-semibold">
                {maskNik(user.nik)}
              </span>
            </div>
          )}

          {user.familyNumber && (
            <div className="flex items-center justify-between">
              <span className="text-gray-secondary-text font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Nomor KK
              </span>
              <span className="font-mono text-gray-heading-main font-semibold">
                {user.familyNumber}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Information Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 space-y-1.5 leading-relaxed">
        <div className="font-semibold flex items-center gap-1.5 text-amber-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" />
          Ketentuan Verifikasi Kependudukan
        </div>
        <p>
          Anda belum dapat login ke dashboard sampai Ketua RT atau Sekretaris menyetujui pendaftaran akun ini di menu <strong>Antrean Persetujuan Registrasi</strong>.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Form Login
        </button>

        <button
          type="button"
          onClick={handleContactSupport}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-gray-border text-gray-secondary-text hover:text-gray-heading-main hover:bg-gray-sidebar-hover rounded-xl text-xs font-medium transition-colors cursor-pointer"
        >
          <HelpCircle className="h-4 w-4" />
          Hubungi Pengurus RT
        </button>
      </div>
    </div>
  );
}
