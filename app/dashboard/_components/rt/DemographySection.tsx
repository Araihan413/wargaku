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

  const maleItem = genderDistribution.find((g) => g.gender === "Laki-laki") || { gender: "Laki-laki", count: 0 };
  const femaleItem = genderDistribution.find((g) => g.gender === "Perempuan") || { gender: "Perempuan", count: 0 };

  const totalGender = Math.max(1, (maleItem.count || 0) + (femaleItem.count || 0));
  const malePct = Math.round(((maleItem.count || 0) / totalGender) * 100);
  const femalePct = Math.round(((femaleItem.count || 0) / totalGender) * 100);

  const totalAgeCalc = useMemo(() => {
    return ageDistribution.reduce((acc, item) => acc + item.count, 0) || 1;
  }, [ageDistribution]);

  const ageChartData = useMemo(() => {
    return ageDistribution.map((item, idx) => {
      const pct = Math.round((item.count / totalAgeCalc) * 100);
      return {
        ...item,
        pct,
        color: PALETTE[idx % PALETTE.length],
      };
    });
  }, [ageDistribution, totalAgeCalc]);

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
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="gender"
                    style={{ outline: "none" }}
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-gender-${index}`} fill={index === 0 ? "#2563EB" : "#EC4899"} style={{ outline: "none" }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
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
                  {malePct}% <span className="text-xs text-gray-secondary-text font-normal">({maleItem.count} Jiwa)</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-sm font-bold text-gray-heading-main">Perempuan</span>
                </span>
                <span className="text-sm font-black text-rose-700">
                  {femalePct}% <span className="text-xs text-gray-secondary-text font-normal">({femaleItem.count} Jiwa)</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>

      {/* Distribusi Kelompok Usia (Donut Chart Recharts persis Halaman Utama) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-lg font-bold text-gray-heading-main mb-4">Distribusi Kelompok Usia</h3>
        {isMounted ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="range"
                    style={{ outline: "none" }}
                  >
                    {ageChartData.map((entry, index) => (
                      <Cell key={`cell-age-${index}`} fill={entry.color} style={{ outline: "none" }} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val || 0} Jiwa (${item?.payload?.pct || 0}%)`,
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
