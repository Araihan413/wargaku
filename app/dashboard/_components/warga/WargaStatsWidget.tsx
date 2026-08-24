"use client";

import React from "react";
import Link from "next/link";
import { Users, Home, Wallet, ArrowUpRight } from "lucide-react";

interface WargaStatsWidgetProps {
  stats?: {
    totalWarga?: number;
    totalKK?: number;
  };
  finance?: {
    balance?: number;
  };
}

export function WargaStatsWidget({ stats, finance }: WargaStatsWidgetProps) {
  const totalWarga = stats?.totalWarga ?? 0;
  const totalKK = stats?.totalKK ?? 0;
  const balance = finance?.balance ?? 0;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {/* Stat 1: Total Penduduk */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-gray-secondary-text">Total Penduduk RT</span>
          <p className="text-2xl font-black text-gray-heading-main">{totalWarga} Warga</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Users className="h-5 w-5" />
        </div>
      </div>

      {/* Stat 2: Total Kartu Keluarga */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-gray-secondary-text">Kartu Keluarga (KK)</span>
          <p className="text-2xl font-black text-gray-heading-main">{totalKK} KK</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Home className="h-5 w-5" />
        </div>
      </div>

      {/* Stat 3: Saldo Kas RT */}
      <Link
        href="/transparansi-kas"
        className="group flex items-center justify-between rounded-2xl border border-gray-border bg-gray-card p-4 shadow-sm transition-all hover:border-purple-200 hover:bg-purple-50/40"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-secondary-text">Saldo Kas RT Transparan</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <p className="text-xl font-black text-purple-700">
            {formatRupiah(balance)}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
          <Wallet className="h-5 w-5" />
        </div>
      </Link>
    </div>
  );
}
