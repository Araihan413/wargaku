"use client";

import React from "react";
import { TunggakanItem } from "../../types";
import { ChevronDown, ChevronRight, MessageSquare, AlertCircle, CheckCircle2, Loader } from "lucide-react";

interface TunggakanTableProps {
  data: TunggakanItem[];
  isLoading: boolean;
}

const WA_REMINDER_TEMPLATE = (name: string, amount: number, months: string) =>
  `Assalamu'alaikum Bapak/Ibu *${name}*, kami menginformasikan bahwa masih terdapat tunggakan iuran RT senilai *Rp ${amount.toLocaleString("id-ID")}* untuk periode ${months}. Mohon kiranya dapat segera diselesaikan. Terima kasih. 🙏`;

export const TunggakanTable: React.FC<TunggakanTableProps> = ({
  data,
  isLoading,
}) => {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-secondary-text">
        <Loader className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm font-semibold">Memuat laporan tunggakan...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
        <p className="text-sm font-bold text-gray-heading-main">Tidak Ada Tunggakan!</p>
        <p className="text-xs text-gray-secondary-text mt-1 max-w-xs">
          Semua KK telah membayar iuran wajib mereka. Luar biasa!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, idx) => {
        const isOpen = expanded.has(item.familyId);
        const months = item.payments.map((p) => p.period).join(", ");
        const waMsg = WA_REMINDER_TEMPLATE(item.headName, item.totalUnpaid, months);

        return (
          <div
            key={item.familyId}
            className="rounded-2xl border border-gray-border bg-gray-card overflow-hidden shadow-sm"
          >
            {/* Row Header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-sidebar-hover/50 transition-colors "
              onClick={() => toggle(item.familyId)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-secondary-text w-6 text-right">{idx + 1}</span>
                <div>
                  <p className="text-sm font-bold text-gray-heading-main">{item.headName}</p>
                  <p className="text-[10px] text-gray-secondary-text font-mono mt-0.5">
                    {item.familyNumber} · Blok {item.dwellingBlock} / No. {item.dwellingHouse}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-secondary-text font-semibold">{item.unpaidMonths} Bulan Menunggak</p>
                  <p className="text-sm font-black text-rose-700 font-mono">
                    Rp {item.totalUnpaid.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* WA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const encoded = encodeURIComponent(waMsg);
                    window.open(`https://wa.me/?text=${encoded}`, "_blank");
                  }}
                  title="Kirim Reminder via WhatsApp"
                  className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>

                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-placeholder" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-placeholder" />
                )}
              </div>
            </div>

            {/* Mobile total */}
            <div className="sm:hidden px-4 pb-2 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <span className="text-xs font-bold text-rose-700">
                {item.unpaidMonths} bulan · Rp {item.totalUnpaid.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Detail expanded */}
            {isOpen && (
              <div className="border-t border-gray-border bg-gray-sidebar-hover/30 px-4 py-3">
                <p className="text-[10px] font-bold text-gray-secondary-text uppercase tracking-wider mb-2">Rincian Tunggakan</p>
                <div className="space-y-1.5">
                  {item.payments.map((p) => (
                    <div key={p.period} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-gray-heading-main">{p.period}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-secondary-text">
                          Tagihan: <strong className="font-mono">Rp {p.amountBilled.toLocaleString("id-ID")}</strong>
                        </span>
                        {p.amountPaid > 0 && (
                          <span className="text-emerald-700">
                            Bayar: <strong className="font-mono">Rp {p.amountPaid.toLocaleString("id-ID")}</strong>
                          </span>
                        )}
                        <span className="font-bold text-rose-700 font-mono">
                          Sisa: Rp {p.amountDue.toLocaleString("id-ID")}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status === "partially_paid" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                          {p.status === "partially_paid" ? "Kurang" : "Belum Bayar"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Copy reminder text */}
                <div className="mt-3 pt-2 border-t border-gray-border">
                  <p className="text-[10px] font-bold text-gray-secondary-text mb-1">Template Pesan Reminder:</p>
                  <div className="bg-gray-card rounded-xl p-2.5 border border-gray-border text-xs text-gray-secondary-text leading-relaxed">
                    {waMsg}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(waMsg);
                    }}
                    className="mt-1.5 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Salin Pesan
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
