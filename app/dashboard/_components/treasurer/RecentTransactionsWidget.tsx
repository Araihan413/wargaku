import React from "react";
import { ArrowUpRight, ArrowDownRight, FileText, ExternalLink, History } from "lucide-react";
import { RecentTransactionItem } from "./types";
import { SecureDocumentLink } from "@/components/SecureDocumentLink";

interface RecentTransactionsWidgetProps {
  transactions: RecentTransactionItem[];
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ transactions }) => {
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

  return (
    <div className="border border-gray-border bg-gray-card rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-heading-main">
              Riwayat Transaksi Keuangan Terkini
            </h3>
            <p className="text-xs text-gray-secondary-text mt-0.5">
              Daftar transaksi kas RT dan pencatatan iuran warga terbaru.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-border bg-gray-sidebar-hover/30 text-gray-secondary-text font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Tipe & Transaksi</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4 text-right">Nominal</th>
              <th className="py-3 px-4 text-center">Nota / Bukti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border/60">
            {transactions.length > 0 ? (
              transactions.map((t) => {
                const isIncome = t.type === "income";
                return (
                  <tr key={t.id} className="hover:bg-gray-sidebar-hover/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-rose-50 text-rose-600 border border-rose-100"
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-heading-main block">
                            {t.title}
                          </span>
                          <span className="text-[10px] text-gray-placeholder block mt-0.5">
                            ID: {t.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-page-bg border border-gray-border text-gray-heading-main">
                        {t.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-heading-main">
                      {formatDate(t.date)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                      <span className={isIncome ? "text-emerald-600" : "text-rose-600"}>
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {t.receiptFile ? (
                        <SecureDocumentLink
                          type="receipt"
                          recordId={Number(t.id)}
                          mode="view"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-border bg-white text-[10px] font-bold text-gray-heading-main hover:bg-gray-sidebar-hover transition cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Nota</span>
                          <ExternalLink className="h-2.5 w-2.5 text-gray-placeholder" />
                        </SecureDocumentLink>
                      ) : (
                        <span className="text-[10px] text-gray-placeholder font-medium">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-placeholder font-medium">
                  Belum ada transaksi keuangan yang tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
