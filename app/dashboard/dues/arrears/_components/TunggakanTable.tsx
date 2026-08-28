"use client";

import React, { useState } from "react";
import { TunggakanItem } from "../../types";
import { ChevronDown, ChevronRight, MessageSquare, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

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
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyMessage = (familyId: number, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(familyId);
      toast.success("Pesan reminder berhasil disalin ke clipboard!");
      setTimeout(() => {
        setCopiedId((curr) => (curr === familyId ? null : curr));
      }, 2500);
    } catch {
      toast.error("Gagal menyalin pesan");
    }
  };

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
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-card border border-gray-border rounded-2xl p-4 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gray-border/70 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 w-44 bg-gray-border/60 rounded-md" />
                <div className="h-3 w-28 bg-gray-border/40 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 bg-gray-border/60 rounded-md" />
              <div className="h-8 w-8 bg-gray-border/70 rounded-xl" />
            </div>
          </div>
        ))}
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-center ${p.status === "partially_paid" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
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
                    type="button"
                    onClick={() => handleCopyMessage(item.familyId, waMsg)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedId === item.familyId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Template Pesan</span>
                      </>
                    )}
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
