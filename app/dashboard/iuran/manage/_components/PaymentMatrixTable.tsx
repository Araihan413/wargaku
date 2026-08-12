"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { FeePaymentItem } from "../../types";

interface PaymentMatrixTableProps {
  payments: FeePaymentItem[];
  isLoading: boolean;
  onPay: (payment: FeePaymentItem) => void;
}

const StatusBadge: React.FC<{ status: FeePaymentItem["status"] }> = ({ status }) => {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Lunas
      </span>
    );
  }
  if (status === "partially_paid") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3" /> Kurang Bayar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
      <AlertCircle className="h-3 w-3" /> Belum Bayar
    </span>
  );
};

export const PaymentMatrixTable: React.FC<PaymentMatrixTableProps> = ({
  payments,
  isLoading,
  onPay,
}) => {
  return (
    <div className="border border-gray-border rounded-2xl bg-gray-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="border-b border-gray-border bg-gray-sidebar-hover/90 text-gray-secondary-text font-bold tracking-wider">
            <tr>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">No</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Kepala Keluarga</th>
              <th className="py-3.5 px-4 text-left whitespace-nowrap">Alamat</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Tagihan</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Terbayar</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Sisa</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-border">
            {isLoading ? (
              <TableSkeleton rowCount={5} colCount={8} cellPadding="py-3 px-4" />
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                    <p className="text-sm font-bold text-gray-heading-main">Tidak ada data tagihan</p>
                    <p className="text-xs text-gray-secondary-text mt-1">Pilih aturan iuran dan periode untuk melihat daftar tagihan.</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-sidebar-hover/40 transition-colors">
                  <td className="py-3 px-4 text-xs text-gray-secondary-text font-bold">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-heading-main text-xs">{p.headName}</p>
                    <p className="text-[10px] text-gray-secondary-text font-mono">{p.familyNumber}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-secondary-text whitespace-nowrap">
                    Blok {p.dwellingBlock} / No. {p.dwellingHouse}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-bold text-gray-heading-main whitespace-nowrap">
                    Rp {p.amountBilled.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-emerald-700 whitespace-nowrap">
                    Rp {p.amountPaid.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs font-bold text-rose-700 whitespace-nowrap">
                    {p.amountDue > 0 ? `Rp ${p.amountDue.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.status !== "paid" ? (
                      <button
                        onClick={() => onPay(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        Bayar Iuran
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-placeholder font-semibold">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
