"use client";

import React, { useState, useCallback, useEffect } from "react";
import { TunggakanItem, FeeRule } from "../types";
import { TunggakanTable } from "./_components/TunggakanTable";
import { RefreshButton } from "@/components/RefreshButton";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function LaporanTunggakanPage() {
  return (
    <PermissionGuard requiredPermission="view-arrears">
      <LaporanTunggakanContent />
    </PermissionGuard>
  );
}

function LaporanTunggakanContent() {

  const [rules, setRules] = useState<FeeRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [tunggakanData, setTunggakanData] = useState<TunggakanItem[]>([]);
  const [summary, setSummary] = useState({ totalFamiliesWithArrears: 0, totalUnpaidRupiah: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const fetchTunggakan = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRuleId) params.set("ruleId", selectedRuleId);
      const res = await fetch(`/api/fee-payments/tunggakan?${params}`);
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
        const res = await fetch("/api/fee-rules");
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
        const res = await fetch(`/api/fee-payments/tunggakan?${params}`);
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

  const filteredData = debouncedSearchQuery
    ? tunggakanData.filter(
        (t) =>
          t.headName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          t.familyNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          t.dwellingBlock.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    : tunggakanData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">Laporan Tunggakan Iuran</h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">
            Rekap KK yang belum atau kurang membayar iuran wajib bulanan.
          </p>
        </div>
        <RefreshButton
          onClick={fetchTunggakan}
          isLoading={isLoading}
        />
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-card border border-gray-border rounded-2xl p-4 shadow-sm">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari nama KK..."
          containerClassName="w-full sm:max-w-96"
        />

        <div className="w-64">
          <CustomSelect
            value={selectedRuleId}
            onChange={(val) => setSelectedRuleId(val)}
            options={[
              { value: "", label: "Semua Jenis Iuran" },
              ...rules.filter((r) => r.isMandatory).map((r) => ({
                value: String(r.id),
                label: `${r.name} (Rp ${r.amount.toLocaleString("id-ID")})`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <TunggakanTable data={filteredData} isLoading={isLoading} />
    </div>
  );
}
