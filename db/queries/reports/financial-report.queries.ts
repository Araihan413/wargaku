import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, gte, lte, lt, desc, sql } from 'drizzle-orm';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export async function getFinancialReportData(options: { year?: number; month?: number } = {}) {
  const currentYear = new Date().getFullYear();
  const year = options.year ?? currentYear;
  const month = options.month;

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (month && month >= 1 && month <= 12) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
    periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
    periodLabel = `Tahun ${year}`;
  }

  // 1. Calculate Opening Balance prior to startDate (Single Source of Truth: cashTransactions)
  const [cashBefore] = await db
    .select({
      totalIncomeBefore: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExpenseBefore: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    })
    .from(schema.cashTransactions)
    .where(lt(schema.cashTransactions.transactionDate, startDate));

  const openingBalance =
    (cashBefore?.totalIncomeBefore || 0) - (cashBefore?.totalExpenseBefore || 0);

  // 2. Fetch Cash Transactions in Period
  const cashInPeriod = await db
    .select({
      id: schema.cashTransactions.id,
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      transactionDate: schema.cashTransactions.transactionDate,
      category: schema.cashTransactions.category,
      description: schema.cashTransactions.description,
      receiptFile: schema.cashTransactions.receiptFile,
      createdBy: schema.cashTransactions.createdBy,
      creatorName: schema.users.name,
    })
    .from(schema.cashTransactions)
    .leftJoin(schema.users, eq(schema.cashTransactions.createdBy, schema.users.id))
    .where(
      and(
        gte(schema.cashTransactions.transactionDate, startDate),
        lte(schema.cashTransactions.transactionDate, endDate)
      )
    )
    .orderBy(desc(schema.cashTransactions.transactionDate), desc(schema.cashTransactions.id));

  // 3. Summarize Amounts & Build Single Ledger
  let totalIncome = 0;
  let totalCashIncome = 0;
  let totalFeeIncome = 0;
  let totalExpense = 0;

  const incomeCategoryMap = new Map<string, number>();
  const expenseCategoryMap = new Map<string, number>();
  const ledger: any[] = [];

  for (const c of cashInPeriod) {
    const amt = Math.round(Number(c.amount));
    if (c.type === "income") {
      totalIncome += amt;
      if (c.category === "Iuran Warga") {
        totalFeeIncome += amt;
      } else {
        totalCashIncome += amt;
      }
      incomeCategoryMap.set(c.category, (incomeCategoryMap.get(c.category) || 0) + amt);
    } else {
      totalExpense += amt;
      expenseCategoryMap.set(c.category, (expenseCategoryMap.get(c.category) || 0) + amt);
    }

    const cDate = c.transactionDate;
    const dateStr = cDate
      ? cDate instanceof Date
        ? cDate.toISOString().split("T")[0]
        : String(cDate).split("T")[0]
      : new Date().toISOString().split("T")[0];

    ledger.push({
      id: `CASH-${c.id}`,
      date: dateStr,
      type: c.type,
      source: c.category === "Iuran Warga" ? "Iuran Warga" : "Kas RT",
      category: c.category,
      description: c.description || "-",
      amount: amt,
      receiptFile: c.receiptFile || null,
      recordedBy: c.creatorName || "Pengurus RT",
    });
  }

  const netChange = totalIncome - totalExpense;
  const endingBalance = openingBalance + netChange;

  // 4. Build Category Breakdown
  const incomeBreakdown = Array.from(incomeCategoryMap.entries()).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalIncome > 0 ? Number(((amt / totalIncome) * 100).toFixed(1)) : 0,
  }));

  const expenseBreakdown = Array.from(expenseCategoryMap.entries()).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalExpense > 0 ? Number(((amt / totalExpense) * 100).toFixed(1)) : 0,
  }));

  return {
    period: {
      year,
      month: month || null,
      label: periodLabel,
    },
    summary: {
      openingBalance,
      totalIncome,
      totalCashIncome,
      totalFeeIncome,
      totalExpense,
      endingBalance,
      netChange,
    },
    breakdown: {
      income: incomeBreakdown,
      expense: expenseBreakdown,
    },
    ledger,
  };
}
