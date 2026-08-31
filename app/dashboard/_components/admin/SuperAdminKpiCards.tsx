import React from "react";
import { Users, ShieldCheck, Wallet, Clock, AlertCircle, Activity } from "lucide-react";
import { SuperAdminDashboardSummary } from "./types";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface SuperAdminKpiCardsProps {
  summary: SuperAdminDashboardSummary;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const SuperAdminKpiCards: React.FC<SuperAdminKpiCardsProps> = ({ summary }) => {
  const safeSummary = summary || {
    totalUsers: 0,
    totalResidents: 0,
    verifiedFamilies: 0,
    totalCashBalance: 0,
    pendingVerifications: 0,
    activeComplaints: 0,
    todayAuditLogsCount: 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Total Warga */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            Total Warga
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-blue-900 tracking-tight">
            <AnimatedNumber value={safeSummary.totalResidents} />
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Warga tetap & penyewa aktif
          </p>
        </div>
      </div>

      {/* 2. KK Terverifikasi */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            KK Terverifikasi
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
            <AnimatedNumber value={safeSummary.verifiedFamilies} suffix=" KK" />
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            Status data keluarga Verified
          </p>
        </div>
      </div>

      {/* 3. Saldo Kas RT */}
      <div className="p-5 rounded-2xl border border-teal-100 bg-teal-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
            Saldo Kas RT
          </span>
          <div className="p-2 bg-teal-600 text-white rounded-xl">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-black text-teal-700 tracking-tight font-mono">
            <AnimatedNumber value={safeSummary.totalCashBalance} formatFn={formatCurrency} />
          </h3>
          <p className="text-[11px] text-teal-800/80 font-medium mt-1">
            Real-time kas utama RT
          </p>
        </div>
      </div>

      {/* 4. Antrean Pending */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Verifikasi Pending
          </span>
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-700 tracking-tight">
            <AnimatedNumber value={safeSummary.pendingVerifications} />
          </h3>
          <p className="text-[11px] text-amber-800/80 font-medium mt-1">
            Berkas keluarga/warga pending
          </p>
        </div>
      </div>

      {/* 5. Aduan Aktif */}
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
            Aduan Aktif
          </span>
          <div className="p-2 bg-rose-600 text-white rounded-xl">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-rose-700 tracking-tight">
            <AnimatedNumber value={safeSummary.activeComplaints} />
          </h3>
          <p className="text-[11px] text-rose-800/80 font-medium mt-1">
            Menunggu / sedang diproses
          </p>
        </div>
      </div>

      {/* 6. Audit Logs Hari Ini */}
      <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
            Audit Log Hari Ini
          </span>
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-700 tracking-tight">
            <AnimatedNumber value={safeSummary.todayAuditLogsCount} suffix=" Aksi" />
          </h3>
          <p className="text-[11px] text-indigo-800/80 font-medium mt-1">
            Aktivitas dicatat hari ini
          </p>
        </div>
      </div>
    </div>
  );
};
