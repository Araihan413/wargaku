"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PublicErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const PublicErrorState: React.FC<PublicErrorStateProps> = ({
  title = "Terjadi Kesalahan Pemuatan Data",
  message = "Gagal memuat data dari server. Silakan periksa koneksi internet Anda atau coba lagi.",
  onRetry,
  isLoading = false,
}) => {
  return (
    <div className="flex items-center justify-center p-8 sm:p-12 min-h-87.5">
      <div className="flex flex-col items-center justify-center max-w-md w-full rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Coba Memuat..." : "Coba Ulangi"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
