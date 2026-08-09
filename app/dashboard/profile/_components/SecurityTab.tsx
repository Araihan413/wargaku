"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, KeyRound, Save, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export const SecurityTab: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLengthValid = newPassword.length >= 8;
  const isMatchValid = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Masukkan kata sandi saat ini");
      return;
    }

    if (!isLengthValid) {
      toast.error("Kata sandi baru minimal 8 karakter");
      return;
    }

    if (!isMatchValid) {
      toast.error("Konfirmasi kata sandi baru tidak cocok");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res?.error) {
        toast.error(res.error.message || "Gagal mengubah kata sandi. Periksa kata sandi saat ini Anda.");
      } else {
        toast.success("Kata sandi berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Terjadi kesalahan saat mengganti kata sandi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-gray-border pb-4">
        <h2 className="text-base font-extrabold text-gray-heading-main tracking-tight">
          Keamanan & Kata Sandi Akun
        </h2>
        <p className="text-xs text-gray-secondary-text mt-0.5">
          Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun sistem RT.
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kata Sandi Saat Ini <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showCurrentPassword ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ketikkan kata sandi saat ini"
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-placeholder hover:text-gray-secondary-text cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Kata Sandi Baru <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-placeholder hover:text-gray-secondary-text cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
            Konfirmasi Kata Sandi Baru <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-placeholder absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            />
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="p-3.5 bg-slate-50 border border-gray-border rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold">
            {isLengthValid ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={isLengthValid ? "text-emerald-800" : "text-slate-600"}>
              Panjang kata sandi baru minimal 8 karakter
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            {isMatchValid ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={isMatchValid ? "text-emerald-800" : "text-slate-600"}>
              Konfirmasi kata sandi baru harus sesuai
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isLengthValid || !isMatchValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memperbarui Kata Sandi...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Perbarui Kata Sandi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
