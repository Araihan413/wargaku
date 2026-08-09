import React from "react";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { TreasurerDashboardStats } from "./types";

interface TreasurerKpiCardsProps {
  stats: TreasurerDashboardStats;
}

export const TreasurerKpiCards: React.FC<TreasurerKpiCardsProps> = ({ stats }) => {
  const safeStats = stats || {
    totalBalance: 0,
    thisMonthIncome: 0,
    thisMonthExpense: 0,
    duesStats: {
      totalActiveFamilies: 0,
      paidFamiliesCount: 0,
      unpaidFamiliesCount: 0,
      duesPaidPercentage: 0,
      currentPeriod: "",
    },
    recentTransactions: [],
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const cards = [
    {
      title: "Total Saldo Kas RT",
      value: formatCurrency(safeStats.totalBalance),
      subtitle: "Akumulasi Pemasukan - Pengeluaran",
      icon: Wallet,
      badge: "Kas Utama",
      bgColor: "bg-emerald-50 border-emerald-100",
      iconBg: "bg-emerald-500 text-white",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      textColor: "text-emerald-700",
    },
    {
      title: "Pemasukan Bulan Ini",
      value: formatCurrency(safeStats.thisMonthIncome),
      subtitle: "Setor Iuran & Pemasukan Kas Non-Iuran",
      icon: TrendingUp,
      badge: "Bulan Ini",
      bgColor: "bg-teal-50 border-teal-100",
      iconBg: "bg-teal-500 text-white",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      textColor: "text-teal-700",
    },
    {
      title: "Pengeluaran Bulan Ini",
      value: formatCurrency(safeStats.thisMonthExpense),
      subtitle: "Total Pengeluaran Kas RT",
      icon: TrendingDown,
      badge: "Bulan Ini",
      bgColor: "bg-rose-50 border-rose-100",
      iconBg: "bg-rose-500 text-white",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      textColor: "text-rose-700",
    },
    {
      title: "Capaian Iuran Bulan Ini",
      value: `${safeStats.duesStats.duesPaidPercentage}% KK Lunas`,
      subtitle: `${safeStats.duesStats.paidFamiliesCount} dari ${safeStats.duesStats.totalActiveFamilies} KK Terbayar`,
      icon: CreditCard,
      badge: `Periode ${safeStats.duesStats.currentPeriod}`,
      bgColor: "bg-sky-50 border-sky-100",
      iconBg: "bg-primary text-white",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
      textColor: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative p-5 rounded-2xl border ${card.bgColor} shadow-sm space-y-3 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl shadow-xs ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`inline-flex items-center border px-2.5 py-0.5 rounded-full text-[11px] font-bold ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-secondary-text block">
                {card.title}
              </span>
              <h2 className={`text-xl sm:text-2xl font-black mt-1 ${card.textColor}`}>
                {card.value}
              </h2>
            </div>

            <p className="text-xs text-gray-secondary-text font-medium border-t border-gray-border/50 pt-2">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
