import React, { useSyncExternalStore, useMemo } from "react";
import { Briefcase, GraduationCap, Users } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LabelList,
} from "recharts";
import { DashboardStats } from "../../types";

const PALETTE = [
  "#2563EB", // Blue
  "#10B981", // Emerald
  "#F97316", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#EAB308", // Yellow
  "#6366F1", // Indigo
  "#F43F5E", // Rose
  "#14B8A6", // Teal
];

interface SocialSectionProps {
  religionDistribution: DashboardStats["religionDistribution"];
  educationDistribution: DashboardStats["educationDistribution"];
  occupationDistribution: DashboardStats["occupationDistribution"];
  totalWargaAktif: number;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function SocialSection({
  religionDistribution,
  educationDistribution,
  occupationDistribution,
}: SocialSectionProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const sortedOccupations = useMemo(() => {
    return [...occupationDistribution].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [occupationDistribution]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Pekerjaan Terbanyak Warga (Top 8) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-divider">
          <h3 className="text-lg font-bold text-gray-heading-main">Pekerjaan Terbanyak Warga (Top 8)</h3>
        </div>
        {sortedOccupations.length === 0 ? (
          <div className="h-68 flex flex-col items-center justify-center text-gray-secondary-text gap-2 bg-gray-sidebar-hover/30 rounded-xl border border-dashed border-gray-border p-6">
            <Briefcase className="w-8 h-8 text-gray-placeholder stroke-1" />
            <p className="text-xs font-medium">Belum ada data pekerjaan terdaftar</p>
          </div>
        ) : isMounted ? (
          <div className="h-68 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sortedOccupations}
                margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="occupation"
                  width={105}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill="#334155"
                    fontSize={11}
                    fontWeight={700}
                    offset={8}
                  />
                  {sortedOccupations.map((entry, index) => (
                    <Cell key={`cell-occ-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-68 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>

      {/* 2. Tingkat Pendidikan Warga */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-divider">
          <h3 className="text-lg font-bold text-gray-heading-main">Tingkat Pendidikan Warga</h3>
        </div>
        {educationDistribution.length === 0 ? (
          <div className="h-68 flex flex-col items-center justify-center text-gray-secondary-text gap-2 bg-gray-sidebar-hover/30 rounded-xl border border-dashed border-gray-border p-6">
            <GraduationCap className="w-8 h-8 text-gray-placeholder stroke-1" />
            <p className="text-xs font-medium">Belum ada data pendidikan terdaftar</p>
          </div>
        ) : isMounted ? (
          <div className="h-68 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={educationDistribution}
                margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="education"
                  width={105}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#F8FAFC" }} formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    fill="#334155"
                    fontSize={11}
                    fontWeight={700}
                    offset={8}
                  />
                  {educationDistribution.map((entry, index) => (
                    <Cell key={`cell-edu-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-68 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>

      {/* 3. Sebaran Agama (2-Column Span) */}
      <div className="rounded-2xl border border-gray-border bg-gray-card p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-heading-main mb-4 border-b border-gray-divider pb-2">Sebaran Agama Warga</h3>
        {religionDistribution.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-gray-secondary-text gap-2 bg-gray-sidebar-hover/30 rounded-xl border border-dashed border-gray-border p-6">
            <Users className="w-8 h-8 text-gray-placeholder stroke-1" />
            <p className="text-xs font-medium">Belum ada data agama terdaftar</p>
          </div>
        ) : isMounted ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-2">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={religionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="religion"
                    style={{ outline: "none" }}
                  >
                    {religionDistribution.map((entry, index) => (
                      <Cell key={`cell-rel-${index}`} fill={PALETTE[index % PALETTE.length]} style={{ outline: "none" }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value || 0} Jiwa`, "Jumlah"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 flex-1 w-full text-xs">
              {(() => {
                const totalReligion = religionDistribution.reduce((sum, r) => sum + r.count, 0);
                return religionDistribution.map((item, idx) => {
                  const pct = totalReligion > 0 ? Math.round((item.count / totalReligion) * 100) : 0;
                  return (
                    <div key={item.religion} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                        <span className="text-gray-heading-main font-semibold truncate" title={item.religion}>{item.religion}</span>
                      </div>
                      <span className="font-bold text-gray-heading-main shrink-0 ml-1">
                        {item.count} <span className="text-[10px] text-gray-secondary-text font-normal">({pct}%)</span>
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center text-xs text-gray-secondary-text">Memuat grafik...</div>
        )}
      </div>
    </div>
  );
}
