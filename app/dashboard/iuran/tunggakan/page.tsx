"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, RefreshCw } from "lucide-react";
import { TunggakanItem, FeeRule } from "../types";
import { TunggakanTable } from "./_components/TunggakanTable";

export default function LaporanTunggakanPage() {
  const [rules, setRules] = useState<FeeRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [tunggakanData, setTunggakanData] = useState<TunggakanItem[]>([]);
  const [summary, setSummary] = useState({ totalFamiliesWithArrears: 0, totalUnpaidRupiah: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTunggakan = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRuleId) params.set("ruleId", selectedRuleId);
      const res = await fetch(`/api/iuran/tunggakan?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTunggakanData(data.data || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRuleId]);

  useEffect(() => {
    let isCancelled = false;
    async function loadRules() {
      try {
        const res = await fetch("/api/iuran/rules");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setRules(data.data || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRules();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function loadTunggakan() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedRuleId) params.set("ruleId", selectedRuleId);
        const res = await fetch(`/api/iuran/tunggakan?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setTunggakanData(data.data || []);
            setSummary(data.summary || {});
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }
    loadTunggakan();
    return () => {
      isCancelled = true;
    };
  }, [selectedRuleId]);

  const filteredData = searchQuery
    ? tunggakanData.filter(
        (t) =>
          t.headName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.familyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.dwellingBlock.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tunggakanData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-heading-main">Laporan Tunggakan Iuran</h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">
            Rekap KK yang belum atau kurang membayar iuran wajib bulanan.
          </p>
        </div>
        <button
          onClick={fetchTunggakan}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-border rounded-xl text-xs font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">Total KK Menunggak</p>
          <p className="text-3xl font-black text-rose-800">{summary.totalFamiliesWithArrears}</p>
          <p className="text-xs text-rose-600 mt-1">KK dengan tunggakan iuran wajib</p>
        </div>
        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Total Nilai Tunggakan</p>
          <p className="text-3xl font-black text-amber-800 font-mono">Rp {summary.totalUnpaidRupiah.toLocaleString("id-ID")}</p>
          <p className="text-xs text-amber-600 mt-1">Akumulasi tunggakan iuran wajib</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <select
            value={selectedRuleId}
            onChange={(e) => setSelectedRuleId(e.target.value)}
            className="bg-gray-card border border-gray-border rounded-xl px-3 py-2 text-xs font-bold text-gray-heading-main focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Semua Jenis Iuran</option>
            {rules.filter((r) => r.isMandatory).map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.name} (Rp {r.amount.toLocaleString("id-ID")})
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-placeholder" />
          <input
            type="text"
            placeholder="Cari nama KK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-card border border-gray-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-56"
          />
        </div>
      </div>

      {/* Table */}
      <TunggakanTable data={filteredData} isLoading={isLoading} />
    </div>
  );
}
