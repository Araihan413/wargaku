import React from "react";
import { Home, Users, UserCheck, Building } from "lucide-react";
import { PublicDemographicsData } from "@/db/queries/public-portal";

interface PublicDemographicsSectionProps {
  demographics: PublicDemographicsData;
}

export const PublicDemographicsSection: React.FC<PublicDemographicsSectionProps> = ({
  demographics,
}) => {
  const {
    totalHouses,
    totalResidents,
    totalFamilies,
    totalRenters,
    educationDistribution,
    occupationDistribution,
    dwellingStatus,
    complaintsByCategory,
  } = demographics;

  return (
    <section id="statistik" className="py-12 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Statistik Kependudukan
          </h2>
          <a
            href="#statistik"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Lihat Semua
          </a>
        </div>

        {/* Top 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Rumah */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-100 text-blue-600 shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Rumah</p>
              <h3 className="text-2xl font-black text-slate-900">{totalHouses}</h3>
              <p className="text-[10px] font-medium text-slate-400">Data rumah terdaftar</p>
            </div>
          </div>

          {/* Total Penduduk */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Penduduk</p>
              <h3 className="text-2xl font-black text-slate-900">{totalResidents}</h3>
              <p className="text-[10px] font-medium text-slate-400">Warga terdaftar</p>
            </div>
          </div>

          {/* Kepala Keluarga */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-100 text-purple-600 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Kepala Keluarga</p>
              <h3 className="text-2xl font-black text-slate-900">{totalFamilies}</h3>
              <p className="text-[10px] font-medium text-slate-400">Total KK</p>
            </div>
          </div>

          {/* Penghuni Kos */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-600 shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Penghuni Kos</p>
              <h3 className="text-2xl font-black text-slate-900">{totalRenters}</h3>
              <p className="text-[10px] font-medium text-slate-400">Tinggal di 9 kos</p>
            </div>
          </div>
        </div>

        {/* 4 Analytics Charts (Row 1 Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Chart 1: Sebaran Usia */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
              Sebaran Usia
            </h4>
            <div className="flex items-center justify-between gap-2">
              {/* Donut SVG */}
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4.5"
                    strokeDasharray="52, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4.5"
                    strokeDasharray="12, 100"
                    strokeDashoffset="-52"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="4.5"
                    strokeDasharray="12, 100"
                    strokeDashoffset="-64"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="4.5"
                    strokeDasharray="12, 100"
                    strokeDashoffset="-76"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="4.5"
                    strokeDasharray="12, 100"
                    strokeDashoffset="-88"
                  />
                </svg>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-[10px] font-medium text-slate-600 flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>0 - 5 th (Balita)</span>
                  </span>
                  <span className="font-bold text-slate-800">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span>6 - 12 th (Anak)</span>
                  </span>
                  <span className="font-bold text-slate-800">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>13 - 18 th (Remaja)</span>
                  </span>
                  <span className="font-bold text-slate-800">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>19 - 59 th (Dewasa)</span>
                  </span>
                  <span className="font-bold text-slate-800">52%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>&gt; 60 th (Lansia)</span>
                  </span>
                  <span className="font-bold text-slate-800">12%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Perbandingan Gender */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
              Perbandingan Gender
            </h4>
            <div className="flex items-center justify-between gap-3">
              {/* Donut Chart */}
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeDasharray="48, 100"
                    strokeDashoffset="-52"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="5"
                    strokeDasharray="52, 100"
                  />
                </svg>
              </div>
              {/* Legend */}
              <div className="space-y-2 text-[11px] font-medium text-slate-600 flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Laki-laki</span>
                  </span>
                  <span className="font-bold text-slate-800">52%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Perempuan</span>
                  </span>
                  <span className="font-bold text-slate-800">48%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Sebaran Tingkat Pendidikan */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
              Sebaran Tingkat Pendidikan
            </h4>
            <div className="h-28 flex items-end justify-between gap-1.5 pt-2">
              {educationDistribution.map((ed, i) => {
                const max = 30;
                const pct = Math.min(100, (ed.count / max) * 100);
                const colors = ["#3b82f6", "#22c55e", "#ef4444", "#f97316", "#06b6d4", "#8b5cf6"];
                const color = colors[i % colors.length];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {ed.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-md h-20 flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{ height: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 truncate max-w-[32px] text-center">
                      {ed.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 4: Sebaran Pekerjaan */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
              Sebaran Pekerjaan
            </h4>
            <div className="space-y-1.5 text-[10px]">
              {occupationDistribution.map((occ, i) => {
                const colors = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ef4444", "#06b6d4"];
                const color = colors[i % colors.length];
                const pct = Math.min(100, (occ.count / 30) * 100);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span className="truncate">{occ.label}</span>
                      <span className="font-bold text-slate-800">{occ.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Hunian Bar */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
            Status Hunian
          </h4>
          <div className="space-y-2 text-xs font-medium">
            {/* Terisi */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Terisi (Keluarga Tetap)</span>
                <span className="font-bold">{dwellingStatus.terisi}</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-lg transition-all duration-500"
                  style={{ width: `${dwellingStatus.terisi}%` }}
                />
              </div>
            </div>

            {/* Kos */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Kos / Kontrakan</span>
                <span className="font-bold">{dwellingStatus.kos}</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-lg transition-all duration-500"
                  style={{ width: `${dwellingStatus.kos}%` }}
                />
              </div>
            </div>

            {/* Kosong */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Hunian Kosong</span>
                <span className="font-bold">{dwellingStatus.kosong}</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden">
                <div
                  className="bg-rose-400 h-full rounded-lg transition-all duration-500"
                  style={{ width: `${dwellingStatus.kosong}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sebaran Aduan Berdasarkan Kategori */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
            Sebaran Aduan (Berdasarkan Kategori)
          </h4>
          <div className="h-44 flex items-end justify-between gap-4 pt-4 px-2">
            {complaintsByCategory.map((c, idx) => {
              const heightPct = Math.min(100, (c.count / 20) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {c.count}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-xl h-32 flex items-end overflow-hidden p-1">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPct}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{c.category}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
