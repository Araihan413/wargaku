import React, { useState } from "react";
import { X, Check, Copy, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  temporaryPassword: string;
}

export const ResetPasswordSuccessModal: React.FC<ResetPasswordSuccessModalProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  temporaryPassword,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success("Password temporary berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyalin password");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-border bg-gray-card shadow-2xl transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden p-0">
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-border p-5 shrink-0 bg-gray-card z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success border border-success/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-heading-main">
                Password Berhasil Di-Reset
              </h3>
              <p className="text-[11px] text-gray-secondary-text">Kredensial baru akun pengguna</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-placeholder hover:bg-gray-sidebar-hover hover:text-gray-heading-main transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Email Notification Status Badge */}
          <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
            <MailCheck className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <span className="font-bold block text-sky-950">Email Notifikasi Terkirim</span>
              Pemberitahuan resmi beserta link login telah dikirimkan ke email <span className="font-mono font-semibold">{userEmail}</span>.
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-secondary-text uppercase tracking-wider mb-1">
              Nama Pengguna
            </span>
            <span className="text-sm font-bold text-gray-heading-main block">
              {userName}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black/80 tracking-wider mb-1.5">
              Password Temporary Baru
            </label>
            <div className="relative flex items-center justify-between border-2 border-dashed border-primary/30 rounded-xl p-3.5 bg-primary/5">
              <span className="font-mono text-lg font-extrabold text-primary tracking-wider break-all select-all">
                {temporaryPassword}
              </span>
              <button
                onClick={handleCopyPassword}
                type="button"
                className={`ml-2 flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? "bg-success text-white"
                    : "bg-primary text-white hover:bg-primary-900"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-placeholder mt-1.5">
              💡 Salin password di atas dan berikan kepada pengguna jika diperlukan secara langsung.
            </p>
          </div>
        </div>

        {/* Fixed Actions Footer */}
        <div className="flex justify-end border-t border-gray-border p-4 bg-gray-card shrink-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-900 transition-colors shadow-sm cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
