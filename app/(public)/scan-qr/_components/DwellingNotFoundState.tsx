"use client";

import React from "react";
import Link from "next/link";
import { SearchX, HelpCircle, RefreshCw, Home } from "lucide-react";

interface DwellingNotFoundStateProps {
  searchedQuery: string;
  errorMessage: string;
  onRetry: () => void;
  isLoading: boolean;
}

export const DwellingNotFoundState: React.FC<DwellingNotFoundStateProps> = ({
  searchedQuery,
  errorMessage,
  onRetry,
  isLoading,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-xs animate-in fade-in duration-300">
      {/* Icon soft container */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
        <SearchX className="w-8 h-8" />
      </div>

      {/* Main Title & Description */}
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Data Hunian Tidak Ditemukan
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          {searchedQuery ? (
            <>
              Hasil pencarian untuk <code className="font-mono bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{searchedQuery}</code> tidak cocok dengan data hunian yang terdaftar di wilayah RT.
            </>
          ) : (
            errorMessage || "Data hunian atau QR Code yang dicari belum terdaftar."
          )}
        </p>
      </div>

      {/* Friendly Advice Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left max-w-lg mx-auto space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Saran Pencarian:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 font-medium pl-1">
          <li>Pastikan format Blok &amp; Nomor Rumah benar (contoh: <span className="font-mono font-bold text-slate-800">A1-12</span>, <span className="font-mono font-bold text-slate-800">Blok A1 No 12</span>).</li>
          <li>Periksa kembali kejelasan stiker QR Code saat memindai dengan kamera.</li>
          <li>Jika rumah baru ditempati atau belum terdata, Anda dapat menghubungi Pengurus RT.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Coba Ulangi Pencarian</span>
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Beranda</span>
        </Link>
      </div>
    </div>
  );
};
