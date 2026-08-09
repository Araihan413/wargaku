import React from "react";
import { Activity, Clock, Users, ShieldAlert } from "lucide-react";
import { AuditLogStats } from "../types";

interface AuditLogKpiCardsProps {
  stats: AuditLogStats;
}

export const AuditLogKpiCards: React.FC<AuditLogKpiCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Log */}
      <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-indigo-900 tracking-wider">
            Total Catatan Log
          </span>
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-indigo-700 tracking-tight">
            {stats.totalLogsCount} Log
          </h3>
          <p className="text-[11px] text-indigo-800/80 font-medium mt-1">
            Akumulasi transaksi recorded
          </p>
        </div>
      </div>

      {/* 2. Log Hari Ini */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-blue-900 tracking-wider">
            Log Terpencatat Hari Ini
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-blue-900 tracking-tight">
            {stats.todayLogsCount} Aksi
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Aktivitas 24 jam terakhir
          </p>
        </div>
      </div>

      {/* 3. Pengguna Aktif */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-emerald-900 tracking-wider">
            Pengguna Beraktivitas
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
            {stats.uniqueUsersCount} Akun
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            User unik pencatat log
          </p>
        </div>
      </div>

      {/* 4. Event Keamanan Sensitif */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-amber-900 tracking-wider">
            Event Keamanan Sensitif
          </span>
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-700 tracking-tight">
            {stats.securityEventsCount} Event
          </h3>
          <p className="text-[11px] text-amber-800/80 font-medium mt-1">
            Akses permission, auth & roles
          </p>
        </div>
      </div>
    </div>
  );
};
