"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ReportFilterBar } from "./_components/ReportFilterBar";
import { FinancialKpiCards } from "./_components/FinancialKpiCards";
import { CategoryBreakdownChart } from "./_components/CategoryBreakdownChart";
import { FinancialLedgerTable } from "./_components/FinancialLedgerTable";
import { FinancialReportData, ReportFilterState } from "./types";
import { RefreshButton } from "@/components/RefreshButton";
import { Printer, Loader2, AlertCircle } from "lucide-react";

export default function FinancialReportPage() {
  const currentYear = new Date().getFullYear();
  const [filter, setFilter] = useState<ReportFilterState>({
    year: currentYear,
    month: "all",
  });

  const [data, setData] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("year", String(filter.year));
      if (filter.month !== "all") {
        queryParams.set("month", filter.month);
      }

      const res = await fetch(`/api/reports/financial?${queryParams.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal mengambil data laporan keuangan");
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("year", String(filter.year));
        if (filter.month !== "all") {
          queryParams.set("month", filter.month);
        }

        const res = await fetch(`/api/reports/financial?${queryParams.toString()}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal mengambil data laporan keuangan");
        }

        const json = await res.json();
        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan saat memuat data laporan");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [filter]);

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setFilter({
      year: currentYear,
      month: "all",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print-only Header */}
      <div className="hidden print:block mb-6 border-b border-black pb-4 text-center">
        <h1 className="text-xl font-bold uppercase">LAPORAN KEUANGAN KAS RT</h1>
        <p className="text-sm">Sistem Informasi Pengelolaan Kependudukan & Kas Wargaku</p>
        <p className="text-xs font-semibold mt-1">Periode: {data?.period?.label || "-"}</p>
      </div>

      {/* Main Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
            Laporan Keuangan RT
          </h1>
          <p className="text-sm text-gray-secondary-text mt-0.5">
            Rekapitulasi transparansi kas masuk, setoran iuran warga, dan pengeluaran kas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <RefreshButton onClick={fetchReport} isLoading={isLoading} />

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="print:hidden">
        <ReportFilterBar
          filter={filter}
          onFilterChange={setFilter}
          onReset={handleResetFilters}
        />
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-card border border-gray-border rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-heading-main">Memuat Data Laporan Keuangan...</p>
          <p className="text-xs text-black/50">Harap tunggu sebentar</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <FinancialKpiCards summary={data.summary} periodLabel={data.period.label} />

          {/* Charts / Category Breakdown */}
          <CategoryBreakdownChart
            incomeBreakdown={data.breakdown.income}
            expenseBreakdown={data.breakdown.expense}
          />

          {/* Ledger Table */}
          <FinancialLedgerTable items={data.ledger} />
        </>
      ) : null}
    </div>
  );
}