import React, { useSyncExternalStore, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Info, Users } from "lucide-react";
import { DashboardStats } from "../../types";

interface DemographySectionProps {
  genderDistribution: DashboardStats["genderDistribution"];
  ageDistribution: DashboardStats["ageDistribution"];
  ktpDistribution?: DashboardStats["ktpDistribution"];
  totalWargaAktif: number;
}

const PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

const AGE_COLOR_MAP: Record<string, string> = {
  "Anak (0-11 thn)": "#2563EB",
  "Remaja (12-17 thn)": "#8B5CF6",
  "Dewasa (18-59 thn)": "#10B981",
  "Lansia (60+ thn)": "#F97316",
  "Belum Terdata": "#94A3B8",
};

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function DemographySection({
  genderDistribution,
  ageDistribution,
  ktpDistribution,
}: DemographySectionProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const safeGenderList = useMemo(() => {
    if (!genderDistribution || genderDistribution.length === 0) {
      return [
        { gender: "Laki-laki", count: 0 },
        { gender: "Perempuan", count: 0 },
      ];
    }
    return genderDistribution;
  }, [genderDistribution]);

  const maleItem = safeGenderList.find((g) => g.gender === "Laki-laki") || { gender: "Laki-laki", count: 0 };
  const femaleItem = safeGenderList.find((g) => g.gender === "Perempuan") || { gender: "Perempuan", count: 0 };

  const rawGenderSum = (maleItem.count || 0) + (femaleItem.count || 0);
  const malePct = rawGenderSum > 0 ? Math.round(((maleItem.count || 0) / rawGenderSum) * 100) : 0;
  const femalePct = rawGenderSum > 0 ? Math.round(((femaleItem.count || 0) / rawGenderSum) * 100) : 0;

  const safeAgeList = useMemo(() => {
    if (!ageDistribution || ageDistribution.length === 0) {
      return [];
    }
    return ageDistribution;
  }, [ageDistribution]);

  const totalAgeCalc = useMemo(() => {
    return safeAgeList.reduce((acc, item) => acc + (item.count || 0), 0);
  }, [safeAgeList]);

  const ageChartData = useMemo(() => {
    return safeAgeList.map((item, idx) => {
      const pct = totalAgeCalc > 0 ? Math.round(((item.count || 0) / totalAgeCalc) * 100) : 0;
      return {
        ...item,
        count: item.count || 0,
        pct,
        color: AGE_COLOR_MAP[item.range] || PALETTE[idx % PALETTE.length],
      };
    });
  }, [safeAgeList, totalAgeCalc]);

  const genderChartData = useMemo(() => {
    if (rawGenderSum === 0) {
      return [
        { gender: "Belum Ada Data", count: 1 },
      ];
    }
    return safeGenderList;
  }, [rawGenderSum, safeGenderList]);

  const finalAgeChartData = useMemo(() => {
    if (totalAgeCalc === 0) {
      return [{ range: "Belum Ada Data Usia", count: 1, pct: 0, color: "#CBD5E1" }];
    }
    const active = ageChartData.filter((a) => a.count > 0);
    return active.length > 0 ? active : [{ range: "Belum Ada Data Usia", count: 1, pct: 0, color: "#CBD5E1" }];
  }, [totalAgeCalc, ageChartData]);

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
        { name: "KTP Kelurahan Setempat", count: 1, color: "#CBD5E1" },
        { name: "KTP Luar Kelurahan", count: 1, color: "#E2E8F0" },
      ];
    }
    return [
      { name: `KTP Kel. ${ktpVillageName}`, count: totalLocalKtp, color: "#10B981" },
      { name: "KTP Luar Kelurahan", count: totalNonLocalKtp, color: "#F97316" },
    ];
  }, [totalKtpAnalyzed, ktpVillageName, totalLocalKtp, totalNonLocalKtp]);

  return (
    <div className="space-y-6">
      {/* Kartu Domisili KTP Utama */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-heading-main flex items-center gap-2">
              <span>Komposisi Domisili Asal KTP Warga</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Kel. {ktpVillageName}
              </span>
            </h3>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Perbandingan warga ber-KTP asli Kelurahan {ktpVillageName} dengan warga pendatang (KK &amp; Kos/Sewa).
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-secondary-text">Total Dianalisis: </span>
            <span className="text-sm font-bold text-gray-heading-main">{totalKtpAnalyzed} Jiwa</span>
          </div>
        </div>

        {isMounted ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Chart Donut */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ktpChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="name"
                      style={{ outline: "none" }}
                    >
                      {ktpChartData.map((entry, index) => (
                        <Cell
                          key={`cell-ktp-${index}`}
                          fill={totalKtpAnalyzed === 0 ? "#CBD5E1" : entry.color}
                          style={{ outline: "none" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${totalKtpAnalyzed === 0 ? 0 : val || 0} Jiwa`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrik Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card KTP Lokal */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-heading-main">KTP Kel. {ktpVillageName}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    KTP Setempat
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-700">
                    {localPct}%
                  </div>
                  <div className="text-xs text-gray-secondary-text mt-0.5">
                    {totalLocalKtp} Jiwa dari {totalKtpAnalyzed} total warga aktif
                  </div>
                </div>
              </div>

              {/* Card KTP Luar */}
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-100 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-sm font-bold text-gray-heading-main">KTP Luar Kelurahan</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    KTP Luar
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-orange-700">
                    {nonLocalPct}%
                  </div>
                  <div className="text-xs text-gray-secondary-text mt-0.5">
                    {totalNonLocalKtp} Jiwa dari {totalKtpAnalyzed} total warga aktif
                  </div>
                </div>
                {ktpDistribution?.nonLocalBreakdown ? (
                  <div className="pt-2.5 border-t border-orange-200/60 grid grid-cols-2 gap-2 text-center text-[11px]">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-orange-200/50">
                      <span className="text-gray-secondary-text block text-[10px]">Anak Kos</span>
                      <strong className="text-gray-heading-main font-bold">{ktpDistribution.nonLocalBreakdown.individualKos}</strong>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-orange-200/50">
                      <span className="text-gray-secondary-text block text-[10px]">Warga</span>
                      <strong className="text-gray-heading-main font-bold">
                        {ktpDistribution.nonLocalBreakdown.familyRenters + ktpDistribution.nonLocalBreakdown.permanentResidents}
                      </strong>
                    </div>
                  </div>
                ) : ktpDistribution?.breakdown && (
                  <div className="pt-2 border-t border-orange-200/60 text-[11px] text-gray-heading-small flex justify-between">
                    <span>Keluarga/KK: <b>{ktpDistribution.breakdown.wargaTetap.nonLocal}</b></span>
                    <span>Anak Kos: <b>{ktpDistribution.breakdown.penghuniSewa.nonLocal}</b></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik domisili KTP...</div>
        )}
      </div>

      {/* Grid Rasio Gender & Usia */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rasio Gender */}
        <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-lg font-bold text-gray-heading-main mb-4">Rasio Gender Warga</h3>
          {isMounted ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="gender"
                      style={{ outline: "none" }}
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell
                          key={`cell-gender-${index}`}
                          fill={rawGenderSum === 0 ? "#CBD5E1" : index === 0 ? "#2563EB" : "#EC4899"}
                          style={{ outline: "none" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${rawGenderSum === 0 ? 0 : value || 0} Jiwa`, "Jumlah"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 w-full sm:w-auto flex-1 max-w-xs text-xs font-medium">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-gray-heading-main">Laki-laki</span>
                  </span>
                  <span className="font-black text-blue-700 text-xs shrink-0 pl-2">
                    {malePct}% <span className="text-[10px] text-gray-secondary-text font-normal">({maleItem.count || 0})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-gray-heading-main">Perempuan</span>
                  </span>
                  <span className="font-black text-rose-700 text-xs shrink-0 pl-2">
                    {femalePct}% <span className="text-[10px] text-gray-secondary-text font-normal">({femaleItem.count || 0})</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
          )}
          <p className="text-[10px] text-gray-secondary-text border-t border-gray-divider pt-2.5 mt-4 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-gray-secondary-text shrink-0" />
            <span>Data dihimpun dari warga berkeluarga (data KK).</span>
          </p>
        </div>

        {/* Distribusi Kelompok Usia */}
        <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-heading-main mb-4">Distribusi Kelompok Usia</h3>
            {isMounted ? (
              totalAgeCalc === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-secondary-text gap-2 bg-gray-sidebar-hover/30 rounded-xl border border-dashed border-gray-border p-6">
                  <Users className="w-8 h-8 text-gray-placeholder stroke-1" />
                  <p className="text-xs font-medium">Belum ada data usia warga terdaftar</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                  <div className="h-48 w-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={finalAgeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="range"
                          style={{ outline: "none" }}
                        >
                          {finalAgeChartData.map((entry, index) => (
                            <Cell key={`cell-age-${index}`} fill={entry.color} style={{ outline: "none" }} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any, item: any) => [
                            `${val || 0} (${item?.payload?.pct || 0}%)`,
                            "Jumlah",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs font-medium text-gray-heading-small flex-1 w-full max-w-xs">
                    {ageChartData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 border-b border-gray-divider pb-1.5 last:border-0">
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.range}</span>
                        </span>
                        <span className="font-bold text-gray-heading-main shrink-0">
                          {item.pct}% <span className="text-[10px] text-gray-secondary-text font-normal">({item.count})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
            )}
          </div>
          <p className="text-[10px] text-gray-secondary-text border-t border-gray-divider pt-2.5 mt-4 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-gray-secondary-text shrink-0" />
            <span>Data dihimpun dari warga berkeluarga (data KK).</span>
          </p>
        </div>
      </div>
    </div>
  );
}
