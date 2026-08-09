"use client";

import React from "react";
import Link from "next/link";
import { Users, AlertCircle, Wallet, Search, ArrowUpRight, Lock, Receipt } from "lucide-react";
import { toast } from "sonner";

interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  bgGradient: string;
  iconBg: string;
  iconColor: string;
  requiresVerification?: boolean;
}

const actions: QuickActionItem[] = [
  {
    title: "Kelola Keluarga",
    description: "Data KK, anggota keluarga, & upload scan KTP",
    href: "/dashboard/family",
    icon: Users,
    bgGradient: "hover:border-blue-200 hover:bg-blue-50/50",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    iconColor: "text-blue-600",
  },
  {
    title: "Status Iuran",
    description: "Pantau kelunasan & histori iuran dari Bendahara",
    href: "/dashboard/my-fees",
    icon: Receipt,
    badge: "Iuran",
    bgGradient: "hover:border-emerald-200 hover:bg-emerald-50/50",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    iconColor: "text-emerald-600",
    requiresVerification: true,
  },
  {
    title: "Lapor Pengaduan",
    description: "Sampaikan laporan & aspirasi ke pengurus RT",
    href: "/lapor",
    icon: AlertCircle,
    bgGradient: "hover:border-amber-200 hover:bg-amber-50/50",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    iconColor: "text-amber-600",
  },
  {
    title: "Keuangan RT",
    description: "Transparansi saldo kas, pemasukan, & pengeluaran",
    href: "/transparansi-kas",
    icon: Wallet,
    bgGradient: "hover:border-purple-200 hover:bg-purple-50/50",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    iconColor: "text-purple-600",
  },
  {
    title: "Pencarian Warga",
    description: "Cari tetangga & info nomor rumah ramah privasi",
    href: "/dashboard/neighborhood",
    icon: Search,
    bgGradient: "hover:border-indigo-200 hover:bg-indigo-50/50",
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    iconColor: "text-indigo-600",
    requiresVerification: true,
  },
];

interface WargaQuickActionsProps {
  isVerified?: boolean;
}

export function WargaQuickActions({ isVerified = true }: WargaQuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-heading-main">
          Akses Layanan Cepat
        </h2>
        <span className="text-xs text-gray-secondary-text">Pilih menu layanan</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLocked = action.requiresVerification && !isVerified;

          return (
            <Link
              key={action.title}
              href={action.href}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  toast.error("Menu terkunci. Unggah scan KK dan tunggu verifikasi Ketua RT.");
                }
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border border-gray-border bg-gray-card p-4 transition-all duration-200 ${
                isLocked
                  ? "opacity-60 cursor-not-allowed border-amber-200 bg-amber-50/30"
                  : `hover:shadow-md ${action.bgGradient}`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform ${!isLocked ? 'group-hover:scale-110' : ''} ${action.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Lock className="h-3 w-3" /> Terkunci
                    </span>
                  ) : action.badge ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {action.badge}
                    </span>
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                <h3 className="text-sm font-bold text-gray-heading-main group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-secondary-text mt-1 leading-relaxed line-clamp-2">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
