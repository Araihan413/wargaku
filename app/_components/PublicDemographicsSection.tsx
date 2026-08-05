"use client";

import React, { useSyncExternalStore, useMemo } from "react";
import { Home, Users, UserCheck, Building } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { PublicDemographicsData } from "@/db/queries/dashboard/public-portal.queries";

interface PublicDemographicsSectionProps {
  demographics: PublicDemographicsData;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const PALETTE = [
  "#2563eb", // Blue
  "#10b981", // Emerald
  "#f97316", // Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#eab308", // Yellow
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#14b8a6", // Teal
];

export const PublicDemographicsSection: React.FC<PublicDemographicsSectionProps> = ({
  demographics,
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const {
    totalHouses,
    totalResidents,
    totalFamilies,
    totalRenters,
    ageDistribution = [],
    genderRatio = { male: 0, female: 0, malePct: 50, femalePct: 50 },
    educationDistribution = [],
    occupationDistribution = [],
    dwellingStatus = { terisi: 0, kos: 0, kosong: 0 },
    complaintsByCategory = [],
  } = demographics;

  // Sort occupations descending for clean display
  const sortedOccupations = useMemo(() => {
    return [...occupationDistribution].sort((a, b) => b.count - a.count);
  }, [occupationDistribution]);

  const occupationChartHeight = useMemo(() => {
    return Math.max(200, sortedOccupations.length * 38);
  }, [sortedOccupations]);

  const educationChartHeight = useMemo(() => {
    return Math.max(200, educationDistribution.length * 38);
  }, [educationDistribution]);

  const genderData = [
    { name: "Laki-laki", count: genderRatio.male, pct: genderRatio.malePct, color: "#2563eb" },
    { name: "Perempuan", count: genderRatio.female, pct: genderRatio.femalePct, color: "#ec4899" },
  ];

  const totalDwellingCalc = useMemo(() => {
    return Math.max(1, dwellingStatus.terisi + dwellingStatus.kos + dwellingStatus.kosong);
  }, [dwellingStatus]);

  const dwellingData = useMemo(() => {
    const terisiPct = Math.round((dwellingStatus.terisi / totalDwellingCalc) * 100);
    const kosPct = Math.round((dwellingStatus.kos / totalDwellingCalc) * 100);
    const kosongPct = Math.round((dwellingStatus.kosong / totalDwellingCalc) * 100);

    return [
      { name: "Terisi (Tetap)", count: dwellingStatus.terisi, pct: terisiPct, color: "#2563eb" },
      { name: "Kos / Sewa", count: dwellingStatus.kos, pct: kosPct, color: "#10b981" },
      { name: "Hunian Kosong", count: dwellingStatus.kosong, pct: kosongPct, color: "#f43f5e" },
    ];
  }, [dwellingStatus, totalDwellingCalc]);

  return (
    <section id="statistik" className="py-12 px-4 sm:px-6 bg-slate-50/70 border-t border-slate-200">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Statistik Kependudukan
          </h2>
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
              <p className="text-xs font-bold text-slate-500">Penghuni Kos / Sewa</p>
              <h3 className="text-2xl font-black text-slate-900">{totalRenters}</h3>
              <p className="text-[10px] font-medium text-slate-400">Warga sewa aktif</p>
            </div>
          </div>
        </div>

        {/* Main Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Sebaran Usia */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Sebaran Usia Warga
            </h4>
            {isMounted ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ageDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="label"
                        style={{ outline: "none" }}
                      >
                        {ageDistribution.map((entry: any, idx: number) => (
                          <Cell key={`cell-age-${idx}`} fill={entry.color || PALETTE[idx % PALETTE.length]} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val || 0} orang (${item?.payload?.percentage || 0}%)`,
                          "Jumlah",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs font-medium text-slate-600 flex-1 w-full">
                  {ageDistribution.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color || PALETTE[idx % PALETTE.length] }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        {item.percentage}% <span className="text-[10px] text-slate-400 font-normal">({item.count} org)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>

          {/* Chart 2: Perbandingan Gender */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Perbandingan Rasio Gender
            </h4>
            {isMounted ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="name"
                        style={{ outline: "none" }}
                      >
                        {genderData.map((entry, idx) => (
                          <Cell key={`cell-gender-${idx}`} fill={entry.color} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val || 0} orang`, "Jumlah"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 text-xs font-medium text-slate-600 flex-1 w-full">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                      <span className="font-bold text-slate-800">Laki-laki</span>
                    </span>
                    <span className="font-black text-blue-700 text-sm">
                      {genderRatio.malePct}% <span className="text-xs text-slate-500 font-normal">({genderRatio.male} orang)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="font-bold text-slate-800">Perempuan</span>
                    </span>
                    <span className="font-black text-rose-700 text-sm">
                      {genderRatio.femalePct}% <span className="text-xs text-slate-500 font-normal">({genderRatio.female} orang)</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>

          {/* Chart 3: Sebaran Tingkat Pendidikan (Horizontal Layout & Recharts LabelList) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Sebaran Tingkat Pendidikan Warga
            </h4>
            {educationDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">Belum ada data pendidikan terdaftar</p>
            ) : isMounted ? (
              <div className="max-h-64 overflow-y-auto pr-1">
                <div style={{ height: educationChartHeight, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={educationDistribution}
                      margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={105}
                        interval={0}
                        tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: any) => [`${val || 0} orang`, "Jumlah"]} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                        <LabelList
                          dataKey="count"
                          position="right"
                          fill="#475569"
                          fontSize={11}
                          fontWeight={700}
                          offset={8}
                        />
                        {educationDistribution.map((entry: any, idx: number) => (
                          <Cell key={`cell-edu-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>

          {/* Chart 4: Sebaran Pekerjaan (Dynamic Height & Recharts LabelList) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800">
                Sebaran Pekerjaan Warga
              </h4>
            </div>
            {sortedOccupations.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">Belum ada data pekerjaan terdaftar</p>
            ) : isMounted ? (
              <div className="max-h-64 overflow-y-auto pr-1">
                <div style={{ height: occupationChartHeight, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={sortedOccupations}
                      margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={105}
                        interval={0}
                        tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: any) => [`${val || 0} orang`, "Jumlah"]} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                        <LabelList
                          dataKey="count"
                          position="right"
                          fill="#475569"
                          fontSize={11}
                          fontWeight={700}
                          offset={8}
                        />
                        {sortedOccupations.map((entry, idx) => (
                          <Cell key={`cell-occ-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>
        </div>

        {/* Bottom Section: Status Hunian & Sebaran Aduan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 5: Status Hunian Tempat Tinggal (Donut Chart Recharts) */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Status Hunian Tempat Tinggal
            </h4>
            {isMounted ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dwellingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="name"
                        style={{ outline: "none" }}
                      >
                        {dwellingData.map((entry, idx) => (
                          <Cell key={`cell-dwelling-${idx}`} fill={entry.color} style={{ outline: "none" }} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val || 0} unit (${item?.payload?.pct || 0}%)`,
                          "Jumlah",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 text-xs font-medium text-slate-600 flex-1 w-full">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">Terisi (Tetap)</span>
                    </span>
                    <span className="font-black text-blue-700 text-sm">
                      {dwellingData[0].pct}% <span className="text-xs text-slate-500 font-normal">({dwellingData[0].count} unit)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-800">Kos / Sewa</span>
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      {dwellingData[1].pct}% <span className="text-xs text-slate-500 font-normal">({dwellingData[1].count} unit)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-slate-800">Hunian Kosong</span>
                    </span>
                    <span className="font-black text-rose-700 text-sm">
                      {dwellingData[2].pct}% <span className="text-xs text-slate-500 font-normal">({dwellingData[2].count} unit)</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>

          {/* Chart 6: Sebaran Aduan Berdasarkan Kategori */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Sebaran Aduan Warga (Berdasarkan Kategori)
            </h4>
            {complaintsByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">Belum ada aduan terdaftar</p>
            ) : isMounted ? (
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintsByCategory} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="category"
                      interval={0}
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(val: any) => [`${val || 0} aduan`, "Jumlah"]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                      <LabelList
                        dataKey="count"
                        position="top"
                        fill="#475569"
                        fontSize={11}
                        fontWeight={700}
                        offset={6}
                      />
                      {complaintsByCategory.map((c: any, idx: number) => (
                        <Cell key={`cell-complaint-${idx}`} fill={c.color || PALETTE[idx % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
