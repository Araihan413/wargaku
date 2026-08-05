import React, { useSyncExternalStore, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { DashboardStats } from "../../types";

interface DemographySectionProps {
  genderDistribution: DashboardStats["genderDistribution"];
  ageDistribution: DashboardStats["ageDistribution"];
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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function DemographySection({
  genderDistribution,
  ageDistribution,
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
      return [{ range: "Belum Ada Data Usia", count: 0 }];
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
        color: PALETTE[idx % PALETTE.length],
      };
    });
  }, [safeAgeList, totalAgeCalc]);

  const genderChartData = useMemo(() => {
    if (rawGenderSum === 0) {
      return [
        { gender: "Laki-laki", count: 1 },
        { gender: "Perempuan", count: 1 },
      ];
    }
    return safeGenderList;
  }, [rawGenderSum, safeGenderList]);

  const finalAgeChartData = useMemo(() => {
    if (totalAgeCalc === 0) {
      return [{ range: "Belum Ada Data Usia", count: 1, pct: 0, color: "#CBD5E1" }];
    }
    return ageChartData;
  }, [totalAgeCalc, ageChartData]);

  return (
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
            <div className="space-y-3.5 w-full sm:w-auto flex-1 max-w-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-sm font-bold text-gray-heading-main">Laki-laki</span>
                </span>
                <span className="text-sm font-black text-blue-700">
                  {malePct}% <span className="text-xs text-gray-secondary-text font-normal">({maleItem.count || 0} Jiwa)</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-sm font-bold text-gray-heading-main">Perempuan</span>
                </span>
                <span className="text-sm font-black text-rose-700">
                  {femalePct}% <span className="text-xs text-gray-secondary-text font-normal">({femaleItem.count || 0} Jiwa)</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>

      {/* Distribusi Kelompok Usia */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-lg font-bold text-gray-heading-main mb-4">Distribusi Kelompok Usia</h3>
        {isMounted ? (
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
                      `${totalAgeCalc === 0 ? 0 : val || 0} Jiwa (${item?.payload?.pct || 0}%)`,
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
                    {item.pct}% <span className="text-[10px] text-gray-secondary-text font-normal">({item.count} Jiwa)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>
    </div>
  );
}
