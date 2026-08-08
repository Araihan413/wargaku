import React from "react";
import { Edit2, Trash2, FileText, ExternalLink, ArrowUpRight } from "lucide-react";
import { CashTransactionItem } from "../../types";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface IncomeTableProps {
  items: CashTransactionItem[];
  isLoading: boolean;
  onEdit: (item: CashTransactionItem) => void;
  onDelete: (item: CashTransactionItem) => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
  items,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="border border-gray-border bg-gray-card rounded-2xl p-6 shadow-sm space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-border/30 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover text-xs font-bold text-gray-secondary-text">
              <th className="py-3.5 px-4">Tanggal & Transaksi</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4">Keterangan / Sumber</th>
              <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
              <th className="py-3.5 px-4 text-center">Bukti Nota</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-heading-main block">
                          {formatDate(item.transactionDate)}
                        </span>
                        <span className="text-[10px] text-gray-placeholder block mt-0.5">
                          Dicatat oleh: {item.creatorName || "Pengurus RT"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="text-gray-heading-main font-medium block truncate">
                      {item.description || "-"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600">
                    +{formatCurrency(item.amount)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {item.receiptFile ? (
                      <SecureDocumentLink
                        type="receipt"
                        recordId={item.id}
                        mode="view"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-border bg-white text-[10px] font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>Bukti</span>
                        <ExternalLink className="h-2.5 w-2.5 text-gray-placeholder" />
                      </SecureDocumentLink>
                    ) : (
                      <span className="text-[10px] text-gray-placeholder font-medium">-</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg border border-gray-border bg-white hover:bg-gray-sidebar-hover text-gray-heading-main transition cursor-pointer"
                        title="Edit Pemasukan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-rose-600 transition cursor-pointer"
                        title="Hapus Pemasukan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-placeholder font-medium">
                  Belum ada data pemasukan kas yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
