import React, { useState } from "react";
import { LedgerItem } from "../types";
import { Search, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface FinancialLedgerTableProps {
  items: LedgerItem[];
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const FinancialLedgerTable: React.FC<FinancialLedgerTableProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch =
      searchTerm === "" ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl shadow-xs overflow-hidden p-4 md:p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-border">
        <div>
          <h3 className="text-base font-extrabold text-gray-heading-main tracking-tight">
            Buku Besar Transaksi Keuangan
          </h3>
          <p className="text-xs text-gray-secondary-text mt-0.5">
            Daftar rinci seluruh riwayat kas masuk, setoran iuran warga, dan kas keluar disetujui
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Filter Type Pills */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === "all" ? "bg-white text-gray-heading-main shadow-xs" : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("income")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === "income" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setFilterType("expense")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === "expense" ? "bg-white text-rose-700 shadow-xs" : "text-gray-secondary-text hover:text-gray-heading-main"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-placeholder" />
            <input
              type="text"
              placeholder="Cari deskripsi / kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-card border border-gray-border rounded-xl pl-10 pr-3.5 py-2 text-xs text-gray-heading-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover/30 text-gray-secondary-text font-bold uppercase tracking-wider">
              <th className="py-3 px-3.5">Tanggal</th>
              <th className="py-3 px-3.5">Jenis / Sumber</th>
              <th className="py-3 px-3.5">Kategori</th>
              <th className="py-3 px-3.5">Keterangan / Rincian</th>
              <th className="py-3 px-3.5 text-right">Nominal</th>
              <th className="py-3 px-3.5 text-center print:hidden">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-gray-secondary-text">
                  Tidak ada transaksi yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isIncome = item.type === "income";
                return (
                  <tr key={item.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-xs text-gray-heading-main whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-xs text-gray-heading-main font-medium whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-gray-heading-main max-w-xs md:max-w-md truncate">
                      {item.description}
                    </td>
                    <td
                      className={`py-3 px-3.5 text-xs font-bold text-right whitespace-nowrap font-mono ${
                        isIncome ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="py-3 px-3.5 text-center print:hidden">
                      {item.receiptFile ? (
                        <a
                          href={item.receiptFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                          title="Lihat Bukti Nota"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Nota</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-placeholder">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="pt-2 flex items-center justify-between text-xs text-gray-secondary-text">
        <span>Menampilkan {filteredItems.length} transaksi</span>
        <span>Arsip Resmi Keuangan RT</span>
      </div>
    </div>
  );
};
