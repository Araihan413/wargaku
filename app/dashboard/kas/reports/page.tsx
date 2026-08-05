"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ReportFilterBar } from "./_components/ReportFilterBar";
import { FinancialKpiCards } from "./_components/FinancialKpiCards";
import { CategoryBreakdownChart } from "./_components/CategoryBreakdownChart";
import { FinancialLedgerTable } from "./_components/FinancialLedgerTable";
import { OfficialFinancialReportPrint, OfficialReportData, GroupedCategoryItem } from "./_components/OfficialFinancialReportPrint";
import { FinancialReportData, ReportFilterState } from "./types";
import { RefreshButton } from "@/components/RefreshButton";
import { Printer, Loader2, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function FinancialReportPage() {
  const { data: session } = authClient.useSession();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1);

  const [filter, setFilter] = useState<ReportFilterState>({
    year: currentYear,
    month: currentMonthStr,
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
      if (filter.month && filter.month !== "all") {
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
        if (filter.month && filter.month !== "all") {
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

  const handleDirectPrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setFilter({
      year: currentYear,
      month: currentMonthStr,
    });
  };

  // Build Official Report Data Structure for PDF Print
  const selectedMonthNum = parseInt(filter.month || currentMonthStr, 10);
  const selectedMonthName = MONTH_NAMES[selectedMonthNum] || "Agustus";
  const prevMonthNum = selectedMonthNum === 1 ? 12 : selectedMonthNum - 1;
  const prevMonthName = MONTH_NAMES[prevMonthNum] || "Juli";

  // Group Income & Expense by Category for Official Print Document
  const incomeCategoryMap = new Map<string, { description: string; amount: number }[]>();
  const expenseCategoryMap = new Map<string, { description: string; amount: number }[]>();

  if (data?.ledger) {
    data.ledger.forEach((item) => {
      if (item.type === "income") {
        const cat = item.category || "Pemasukan Lainnya";
        if (!incomeCategoryMap.has(cat)) incomeCategoryMap.set(cat, []);
        incomeCategoryMap.get(cat)!.push({
          description: item.description || "Pemasukan Kas",
          amount: item.amount,
        });
      } else if (item.type === "expense") {
        const cat = item.category || "Pengeluaran Lainnya";
        if (!expenseCategoryMap.has(cat)) expenseCategoryMap.set(cat, []);
        expenseCategoryMap.get(cat)!.push({
          description: item.description || "Pengeluaran Kas",
          amount: item.amount,
        });
      }
    });
  }

  const groupedIncome: GroupedCategoryItem[] = Array.from(incomeCategoryMap.entries()).map(
    ([category, items]) => ({
      category,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    })
  );

  const groupedExpense: GroupedCategoryItem[] = Array.from(expenseCategoryMap.entries()).map(
    ([category, items]) => ({
      category,
      items,
      total: items.reduce((sum, i) => sum + i.amount, 0),
    })
  );

  const officialReportData: OfficialReportData = {
    rtName: "RT 002",
    rwName: "RW 023",
    subdistrictName: "SIDANEGARA",
    monthName: selectedMonthName,
    previousMonthName: prevMonthName,
    year: filter.year,
    openingBalance: data?.summary?.openingBalance || 0,
    groupedIncome,
    groupedExpense,
    totalIncome: data?.summary?.totalIncome || 0,
    totalExpense: data?.summary?.totalExpense || 0,
    endingBalance: data?.summary?.endingBalance || 0,
    ketuaRtName: session?.user?.name || "KETUA RT",
    bendaharaName: "BENDAHARA RT",
  };

  return (
    <div className="pb-12">
      {/* Screen-Only Content Container */}
      <div className="space-y-6 print:hidden">
        {/* Main Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-heading-main">
              Laporan Keuangan RT
            </h1>
            <p className="text-sm text-gray-secondary-text mt-0.5">
              Rekapitulasi transparansi kas masuk, setoran iuran warga, dan pengeluaran kas.
            </p>
          </div>

          {/* Single Top Right Action Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <RefreshButton onClick={fetchReport} isLoading={isLoading} />

            <button
              type="button"
              onClick={handleDirectPrint}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Laporan Resmi (PDF)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <ReportFilterBar
          filter={filter}
          onFilterChange={setFilter}
          onReset={handleResetFilters}
        />

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

      {/* Direct Printable Document (Hidden on screen, Visible ONLY when printing) */}
      <OfficialFinancialReportPrint data={officialReportData} />
    </div>
  );
}