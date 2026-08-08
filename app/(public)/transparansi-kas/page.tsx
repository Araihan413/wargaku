"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { PublicPageHeroBanner } from "@/app/_components/PublicPageHeroBanner";
import { PublicLoadMoreButton } from "@/app/_components/PublicLoadMoreButton";
import { PublicDetailModal } from "@/app/_components/PublicDetailModal";
import { PublicErrorState } from "@/app/_components/PublicErrorState";
import { PublicFinanceTransactionItem } from "@/db/queries/dashboard/public-portal.queries";
import { getCachedData, setCachedData } from "@/lib/public-cache";
import { CustomSelect } from "@/components/CustomSelect";
import { SearchInput } from "@/components/SearchInput";

const TYPE_FILTERS = [
  { key: "semua", label: "Semua Transaksi" },
  { key: "masuk", label: "🟢 Pemasukan" },
  { key: "keluar", label: "🔴 Pengeluaran" },
];

export default function PublicFinancePage() {
  const [transactions, setTransactions] = useState<PublicFinanceTransactionItem[]>([]);
  const [summary, setSummary] = useState({
    totalSaldo: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
  });

  const [selectedType, setSelectedType] = useState("semua");
  const [selectedMonth, setSelectedMonth] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<PublicFinanceTransactionItem | null>(null);

  // Generate options for the last 6 months dynamically
  const last6MonthsOptions = useMemo(() => {
    const options = [{ key: "semua", label: "Semua Bulan" }];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      options.push({ key, label });
    }

    return options;
  }, []);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Finance Data (Page 1 or Filter / Search Reset) with Client Caching
  useEffect(() => {
    let isCancelled = false;

    async function fetchFinance() {
      const cacheKey = `finance_${selectedType}_${selectedMonth}_${debouncedSearch}_p1`;
      const cached = getCachedData<{
        data: PublicFinanceTransactionItem[];
        summary: typeof summary;
        hasMore: boolean;
        totalItems: number;
      }>(cacheKey);

      if (cached && reloadTrigger === 0) {
        setTransactions(cached.data);
        setSummary(cached.summary);
        setHasMore(cached.hasMore);
        setTotalItems(cached.totalItems);
        setPage(1);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "8",
          type: selectedType,
          month: selectedMonth,
          search: debouncedSearch,
        });

        const res = await fetch(`/api/public/finance?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!isCancelled) {
            const fetchedData = json.data || [];
            const fetchedSummary = json.summary || { totalSaldo: 0, totalPemasukan: 0, totalPengeluaran: 0 };
            const fetchedHasMore = json.pagination?.hasMore || false;
            const fetchedTotal = json.pagination?.totalItems || 0;

            setTransactions(fetchedData);
            setSummary(fetchedSummary);
            setHasMore(fetchedHasMore);
            setTotalItems(fetchedTotal);
            setPage(1);
            setErrorMessage(null);

            // Save to Cache
            setCachedData(cacheKey, {
              data: fetchedData,
              summary: fetchedSummary,
              hasMore: fetchedHasMore,
              totalItems: fetchedTotal,
            });
          }
        } else {
          const err = await res.json();
          if (!isCancelled) setErrorMessage(err.error || "Gagal mengambil data laporan kas.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching public finance transactions:", err);
          setErrorMessage("Terjadi kesalahan koneksi jaringan. Silakan coba lagi.");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchFinance();

    return () => {
      isCancelled = true;
    };
  }, [selectedType, selectedMonth, debouncedSearch, reloadTrigger]);

  // Handle Load More (Auto-Load on Scroll + Manual Click)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: "8",
        type: selectedType,
        month: selectedMonth,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/public/finance?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions((prev) => [...prev, ...(json.data || [])]);
        setHasMore(json.pagination?.hasMore || false);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Error loading more transactions:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, selectedType, selectedMonth, debouncedSearch]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Hero Header Section */}
      <PublicPageHeroBanner
        icon={Wallet}
        title="Transparansi Kas & Keuangan RT"
        subtitle="Laporan terbuka pemasukan dan pengeluaran kas RT secara berkala, akuntabel, dan transparan."
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 space-y-8 pb-12">
        {/* 1. Summary Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Total Saldo */}
          <div className="bg-linear-to-br from-blue-900 to-blue-700 text-white rounded-2xl p-6 shadow-md border border-blue-600/30 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-200 tracking-wider uppercase">
                Sisa Saldo Kas Utama
              </span>
              <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/15">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {formatCurrency(summary.totalSaldo)}
              </h2>
              <p className="text-[11px] text-blue-200 mt-1 font-medium">
                Sisa akumulasi kas aktif RT
              </p>
            </div>
          </div>

          {/* Card Total Pemasukan */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Total Pemasukan
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                + {formatCurrency(summary.totalPemasukan)}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Iuran warga, hibah & sumbangan
              </p>
            </div>
          </div>

          {/* Card Total Pengeluaran */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Total Pengeluaran
              </span>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                - {formatCurrency(summary.totalPengeluaran)}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Operasional, perbaikan & kegiatan
              </p>
            </div>
          </div>
        </div>

        {/* 2. Filter & Search Bar Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Type Filters & Month Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setSelectedType(f.key);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedType === f.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Month Selector Filter (Last 6 Months) */}
              <div className="w-48 shrink-0">
                <CustomSelect
                  value={selectedMonth}
                  onChange={(val) => {
                    setSelectedMonth(val);
                    setPage(1);
                  }}
                  options={last6MonthsOptions.map((opt) => ({
                    value: opt.key,
                    label: opt.label,
                  }))}
                />
              </div>
            </div>

            {/* Search Box */}
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Cari transaksi / keterangan..."
              containerClassName="w-full lg:w-72 shrink-0"
            />
          </div>
        </div>

        {/* 3. Transaction History List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Daftar Riwayat Transaksi Kas
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Menampilkan <span className="font-bold text-slate-900">{transactions.length}</span> dari{" "}
              <span className="font-bold text-slate-900">{totalItems}</span> transaksi
            </p>
          </div>

          {/* Loading / Error / Empty State */}
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 divide-y divide-slate-100 animate-pulse space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-slate-200 rounded-md" />
                    <div className="h-3 w-64 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-6 w-28 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <PublicErrorState
              title="Gagal Memuat Laporan Kas"
              message={errorMessage}
              onRetry={() => setReloadTrigger((prev) => prev + 1)}
              isLoading={isLoading}
            />
          ) : transactions.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Transaksi Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Belum ada data transaksi kas yang sesuai dengan pencarian atau filter bulan yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedType("semua");
                  setSelectedMonth("semua");
                  setSearchTerm("");
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            </div>
          ) : (
            /* Transaction List Cards */
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-xs overflow-hidden">
              {transactions.map((item) => {
                const isIncome = item.type === "income";
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Icon Circle */}
                      <div
                        className={`p-3 rounded-2xl shrink-0 mt-0.5 sm:mt-0 ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-600 border border-rose-200/60"
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-extrabold border ${
                              isIncome
                                ? "bg-emerald-100/60 text-emerald-800 border-emerald-200"
                                : "bg-rose-100/60 text-rose-800 border-rose-200"
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(String(item.transactionDate))}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.description || item.category}
                        </h4>
                      </div>
                    </div>

                    {/* Amount & Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span
                        className={`text-base font-black tracking-tight whitespace-nowrap ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"} {formatCurrency(item.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(item)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Lihat Detail Transaksi"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lazy Load Button with Auto-Load on Scroll */}
          <PublicLoadMoreButton
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            autoLoadOnScroll={true}
            label="Muat Lebih Banyak Transaksi ↓"
            loadingLabel="Memuat Transaksi Lainnya..."
          />
        </div>
      </section>

      {/* Modal Detail Pop-Up Transaksi */}
      <PublicDetailModal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        title={`Detail Transaksi: ${selectedTransaction?.category || ""}`}
        badges={
          selectedTransaction ? (
            <span
              className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-extrabold ${
                selectedTransaction.type === "income"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-rose-100 text-rose-800 border-rose-200"
              }`}
            >
              {selectedTransaction.type === "income" ? "Pemasukan (+)" : "Pengeluaran (-)"}
            </span>
          ) : null
        }
        metadata={
          selectedTransaction ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nominal:</span>
                <span
                  className={`text-base font-black ${
                    selectedTransaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {selectedTransaction.type === "income" ? "+" : "-"} {formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Tanggal Transaksi:</span>
                <span>{formatDate(String(selectedTransaction.transactionDate))}</span>
              </div>
            </div>
          ) : null
        }
      >
        {selectedTransaction?.description || "Tidak ada rincian catatan keterangan tambahan untuk transaksi ini."}
      </PublicDetailModal>
    </>
  );
}
