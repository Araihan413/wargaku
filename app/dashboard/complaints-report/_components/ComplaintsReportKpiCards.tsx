import React from "react";
import { MessageSquareWarning, AlertCircle, Megaphone, CalendarDays } from "lucide-react";
import { ComplaintsReportOverview } from "../types";

interface ComplaintsReportKpiCardsProps {
  overview: ComplaintsReportOverview;
}

export const ComplaintsReportKpiCards: React.FC<ComplaintsReportKpiCardsProps> = ({
  overview,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Pengaduan Warga */}
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-rose-900 tracking-wider">
            Total Pengaduan Warga
          </span>
          <div className="p-2 bg-rose-600 text-white rounded-xl">
            <MessageSquareWarning className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-rose-700 tracking-tight">
            {overview.totalComplaints} Laporan
          </h3>
          <p className="text-[11px] text-rose-800/80 font-medium mt-1">
            Akumulasi seluruh aduan publik
          </p>
        </div>
      </div>

      {/* 2. Pengaduan Aktif */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-amber-900 tracking-wider">
            Aduan Perlu Ditindaklanjuti
          </span>
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-amber-700 tracking-tight">
            {overview.activeComplaints} Aktif
          </h3>
          <p className="text-[11px] text-amber-800/80 font-medium mt-1">
            Status Menunggu & Proses
          </p>
        </div>
      </div>

      {/* 3. Total Pengumuman RT */}
      <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-blue-900 tracking-wider">
            Total Pengumuman RT
          </span>
          <div className="p-2 bg-blue-600 text-white rounded-xl">
            <Megaphone className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-blue-700 tracking-tight">
            {overview.totalAnnouncements} Postingan
          </h3>
          <p className="text-[11px] text-blue-800/80 font-medium mt-1">
            Dipublikasikan oleh pengurus RT
          </p>
        </div>
      </div>

      {/* 4. Total Agenda Kegiatan RT */}
      <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 shadow-xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-md font-bold text-emerald-900 tracking-wider">
            Total Agenda Kegiatan RT
          </span>
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">
            {overview.totalActivities} Kegiatan
          </h3>
          <p className="text-[11px] text-emerald-800/80 font-medium mt-1">
            Kerja bakti, posyandu, rapat, dll.
          </p>
        </div>
      </div>
    </div>
  );
};
