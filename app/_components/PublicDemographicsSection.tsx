"use client";

import React, { useSyncExternalStore, useMemo } from "react";
import { Home, Users, UserCheck, Building, Info, CheckCircle2, GraduationCap, Briefcase } from "lucide-react";
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
    ktpDistribution,
    educationDistribution = [],
    occupationDistribution = [],
    dwellingStatus = { terisi: 0, kos: 0, kosong: 0 },
    complaintsByCategory = [],
  } = demographics;

  // KTP Domicile Distribution Data
  const ktpVillageName = ktpDistribution?.villageName || "Kelurahan Setempat";
  const totalLocalKtp = ktpDistribution?.totalLocal || 0;
  const totalNonLocalKtp = ktpDistribution?.totalNonLocal || 0;
  const totalKtpAnalyzed = (totalLocalKtp + totalNonLocalKtp) || 0;

  const localPct = ktpDistribution?.localPercentage ?? (totalKtpAnalyzed > 0 ? Math.round((totalLocalKtp / totalKtpAnalyzed) * 100) : 0);
  const nonLocalPct = ktpDistribution?.nonLocalPercentage ?? (totalKtpAnalyzed > 0 ? (100 - localPct) : 0);

  const ktpChartData = useMemo(() => {
    if (totalKtpAnalyzed === 0) {
      return [
        { name: "Belum Ada Data", count: 1, color: "#cbd5e1" },
      ];
    }
    return [
      { name: `KTP Kel. ${ktpVillageName}`, count: totalLocalKtp, color: "#10b981" },
      { name: "KTP Luar Kelurahan", count: totalNonLocalKtp, color: "#f97316" },
    ];
  }, [totalKtpAnalyzed, ktpVillageName, totalLocalKtp, totalNonLocalKtp]);

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

  const genderTotalCount = useMemo(() => (genderRatio.male || 0) + (genderRatio.female || 0), [genderRatio]);

  const genderData = useMemo(() => {
    if (genderTotalCount === 0) {
      return [{ name: "Belum Ada Data", count: 1, pct: 0, color: "#cbd5e1" }];
    }
    return [
      { name: "Laki-laki", count: genderRatio.male, pct: genderRatio.malePct, color: "#2563eb" },
      { name: "Perempuan", count: genderRatio.female, pct: genderRatio.femalePct, color: "#ec4899" },
    ];
  }, [genderTotalCount, genderRatio]);

  const rawDwellingTotal = (dwellingStatus.terisi || 0) + (dwellingStatus.kos || 0) + (dwellingStatus.kosong || 0);

  const dwellingData = useMemo(() => {
    if (rawDwellingTotal === 0) {
      return [
        { name: "Terisi (Tetap)", count: 0, pct: 0, color: "#2563eb" },
        { name: "Kos & Homestay", count: 0, pct: 0, color: "#10b981" },
        { name: "Hunian Kosong", count: 0, pct: 0, color: "#f43f5e" },
      ];
    }
    const terisiPct = Math.round((dwellingStatus.terisi / rawDwellingTotal) * 100);
    const kosPct = Math.round((dwellingStatus.kos / rawDwellingTotal) * 100);
    const kosongPct = Math.round((dwellingStatus.kosong / rawDwellingTotal) * 100);

    return [
      { name: "Terisi (Tetap)", count: dwellingStatus.terisi, pct: terisiPct, color: "#2563eb" },
      { name: "Kos & Homestay", count: dwellingStatus.kos, pct: kosPct, color: "#10b981" },
      { name: "Hunian Kosong", count: dwellingStatus.kosong, pct: kosongPct, color: "#f43f5e" },
    ];
  }, [dwellingStatus, rawDwellingTotal]);

  const dwellingChartData = useMemo(() => {
    if (rawDwellingTotal === 0) {
      return [{ name: "Belum Ada Data", count: 1, pct: 0, color: "#cbd5e1" }];
    }
    return dwellingData;
  }, [rawDwellingTotal, dwellingData]);

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
              <p className="text-xs font-bold text-slate-500">Anak Kos</p>
              <h3 className="text-2xl font-black text-slate-900">{totalRenters}</h3>
              <p className="text-[10px] font-medium text-slate-400">Penyewa kos aktif</p>
            </div>
          </div>
        </div>

        {/* Group 1: 3 Donut & Rasio Demografi Utama (3 Kolom Simetris) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Komposisi Domisili Asal KTP Warga */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Domisili Asal KTP</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Kel. {ktpVillageName}
                  </span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {totalKtpAnalyzed} Jiwa
                </span>
              </div>
              {isMounted ? (
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ktpChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="name"
                          style={{ outline: "none" }}
                        >
                          {ktpChartData.map((entry, idx) => (
                            <Cell
                              key={`cell-ktp-pub-${idx}`}
                              fill={totalKtpAnalyzed === 0 ? "#cbd5e1" : entry.color}
                              style={{ outline: "none" }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [
                            `${totalKtpAnalyzed === 0 ? 0 : val || 0} orang`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
              )}
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-600 w-full">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 truncate block">KTP Kel. {ktpVillageName}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">KTP Setempat</span>
                  </div>
                </div>
                <span className="font-black text-emerald-700 text-xs shrink-0 pl-2">
                  {localPct}% <span className="text-[10px] text-slate-500 font-normal">({totalLocalKtp})</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 truncate block">KTP Luar Kelurahan</span>
                      <span className="text-[10px] text-orange-700 font-semibold">KTP Luar</span>
                    </div>
                  </div>
                  <span className="font-black text-orange-700 text-xs shrink-0 pl-2">
                    {nonLocalPct}% <span className="text-[10px] text-slate-500 font-normal">({totalNonLocalKtp})</span>
                  </span>
                </div>

                {ktpDistribution?.nonLocalBreakdown && (
                  <div className="pt-2 border-t border-orange-200/60 grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="bg-white/80 p-1.5 rounded-md border border-orange-200/50">
                      <span className="text-slate-400 block text-[9px]">Anak Kos</span>
                      <strong className="text-slate-800 text-xs">{ktpDistribution.nonLocalBreakdown.individualKos}</strong>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-md border border-orange-200/50">
                      <span className="text-slate-400 block text-[9px]">Warga</span>
                      <strong className="text-slate-800 text-xs">
                        {ktpDistribution.nonLocalBreakdown.familyRenters + ktpDistribution.nonLocalBreakdown.permanentResidents}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Perbandingan Rasio Gender */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800">
                  Perbandingan Rasio Gender
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {genderTotalCount} Jiwa
                </span>
              </div>
              {isMounted ? (
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
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
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
              )}
            </div>

            <div className="space-y-3 w-full">
              <div className="space-y-2 text-xs font-medium text-slate-600 w-full">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800">Laki-laki</span>
                  </span>
                  <span className="font-black text-blue-700 text-xs shrink-0 pl-2">
                    {genderRatio.malePct}% <span className="text-[10px] text-slate-500 font-normal">({genderRatio.male})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-slate-800">Perempuan</span>
                  </span>
                  <span className="font-black text-rose-700 text-xs shrink-0 pl-2">
                    {genderRatio.femalePct}% <span className="text-[10px] text-slate-500 font-normal">({genderRatio.female})</span>
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Data dihimpun dari warga berkeluarga (data KK).</span>
              </p>
            </div>
          </div>

          {/* Card 3: Status Hunian Tempat Tinggal */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800">
                  Status Hunian Tempat Tinggal
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {totalHouses} Unit
                </span>
              </div>
              {isMounted ? (
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dwellingChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={70}
                          paddingAngle={rawDwellingTotal === 0 ? 0 : 5}
                          dataKey="count"
                          nameKey="name"
                          style={{ outline: "none" }}
                        >
                          {dwellingChartData.map((entry, idx) => (
                            <Cell key={`cell-dwelling-${idx}`} fill={rawDwellingTotal === 0 ? "#cbd5e1" : entry.color} style={{ outline: "none" }} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any, item: any) => [
                            `${rawDwellingTotal === 0 ? 0 : val || 0} unit (${item?.payload?.pct || 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
              )}
            </div>

            <div className="space-y-1.5 text-xs font-medium text-slate-600 w-full">
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">Terisi (Tetap)</span>
                </span>
                <span className="font-black text-blue-700 text-xs shrink-0 pl-2">
                  {dwellingData[0].pct}% <span className="text-[10px] text-slate-500 font-normal">({dwellingData[0].count})</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">Kos & Homestay</span>
                </span>
                <span className="font-black text-emerald-700 text-xs shrink-0 pl-2">
                  {dwellingData[1].pct}% <span className="text-[10px] text-slate-500 font-normal">({dwellingData[1].count})</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">Hunian Kosong</span>
                </span>
                <span className="font-black text-rose-700 text-xs shrink-0 pl-2">
                  {dwellingData[2].pct}% <span className="text-[10px] text-slate-500 font-normal">({dwellingData[2].count})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Group 2: Sebaran Usia & Sebaran Aduan (2 Kolom Seimbang) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 4: Sebaran Usia */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                Sebaran Usia Warga
              </h4>
              {isMounted ? (
                ageDistribution.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                    <Users className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium">Belum ada data usia warga terdaftar</p>
                  </div>
                ) : (
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
                              `${val || 0} (${item?.payload?.percentage || 0}%)`,
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
                            {item.percentage}% <span className="text-[10px] text-slate-400 font-normal">({item.count})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Data dihimpun dari warga berkeluarga (data KK).</span>
            </p>
          </div>

          {/* Card 5: Sebaran Aduan Berdasarkan Kategori */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Sebaran Aduan Warga (Berdasarkan Kategori)
            </h4>
            {complaintsByCategory.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Belum Ada Aduan Warga</p>
                <p className="text-[11px] text-slate-400 text-center">Seluruh fasilitas & keamanan lingkungan dalam kondisi kondusif.</p>
              </div>
            ) : isMounted ? (
              <div className="h-52 w-full pt-2">
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
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">Memuat grafik...</div>
            )}
          </div>
        </div>

        {/* Group 3: Pendidikan & Pekerjaan (2 Kolom Horizontal Bars) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 6: Sebaran Tingkat Pendidikan */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                Sebaran Tingkat Pendidikan Warga
              </h4>
              {educationDistribution.length === 0 ? (
                <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                  <GraduationCap className="w-8 h-8 text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">Belum ada data pendidikan terdaftar</p>
                </div>
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

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Data dihimpun dari warga berkeluarga (data KK).</span>
            </p>
          </div>

          {/* Card 7: Sebaran Pekerjaan */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                Sebaran Pekerjaan Warga
              </h4>
              {sortedOccupations.length === 0 ? (
                <div className="h-52 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                  <Briefcase className="w-8 h-8 text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">Belum ada data pekerjaan terdaftar</p>
                </div>
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

            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Data dihimpun dari warga berkeluarga (data KK).</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
