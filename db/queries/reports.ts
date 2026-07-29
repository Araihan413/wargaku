import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface GetFinancialReportParams {
  year?: number;
  month?: number;
}

export async function getFinancialReportData(params: GetFinancialReportParams) {
  const currentYear = new Date().getFullYear();
  const year = params.year || currentYear;
  const month = params.month;

  // Build date filters
  let startDate: Date;
  let endDate: Date;

  if (month && month >= 1 && month <= 12) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59);
  }

  // 1. Calculate opening balance (all approved transactions before startDate)
  const [openingIncome] = await db
    .select({ total: sql<number>`sum(amount)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(
      and(
        eq(schema.cashTransactions.type, "income"),
        eq(schema.cashTransactions.status, "approved"),
        sql`${schema.cashTransactions.transactionDate} < ${startDate.toISOString().slice(0, 10)}`
      )
    );

  const [openingExpense] = await db
    .select({ total: sql<number>`sum(amount)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(
      and(
        eq(schema.cashTransactions.type, "expense"),
        eq(schema.cashTransactions.status, "approved"),
        sql`${schema.cashTransactions.transactionDate} < ${startDate.toISOString().slice(0, 10)}`
      )
    );

  const openingBalance = (openingIncome?.total || 0) - (openingExpense?.total || 0);

  // 2. Fetch approved transactions in period
  const txs = await db
    .select({
      id: schema.cashTransactions.id,
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      transactionDate: schema.cashTransactions.transactionDate,
      category: schema.cashTransactions.category,
      description: schema.cashTransactions.description,
      receiptFile: schema.cashTransactions.receiptFile,
      creatorName: schema.users.name,
    })
    .from(schema.cashTransactions)
    .leftJoin(schema.users, eq(schema.cashTransactions.createdBy, schema.users.id))
    .where(
      and(
        eq(schema.cashTransactions.status, "approved"),
        sql`${schema.cashTransactions.transactionDate} >= ${startDate.toISOString().slice(0, 10)}`,
        sql`${schema.cashTransactions.transactionDate} <= ${endDate.toISOString().slice(0, 10)}`
      )
    )
    .orderBy(desc(schema.cashTransactions.transactionDate));

  let totalIncome = 0;
  let totalCashIncome = 0;
  let totalFeeIncome = 0;
  let totalExpense = 0;

  const incomeCatMap: Record<string, number> = {};
  const expenseCatMap: Record<string, number> = {};

  const ledger = txs.map((t) => {
    const amt = parseFloat(String(t.amount));
    if (t.type === "income") {
      totalIncome += amt;
      if (t.category.toLowerCase().includes("iuran")) {
        totalFeeIncome += amt;
      } else {
        totalCashIncome += amt;
      }
      incomeCatMap[t.category] = (incomeCatMap[t.category] || 0) + amt;
    } else {
      totalExpense += amt;
      expenseCatMap[t.category] = (expenseCatMap[t.category] || 0) + amt;
    }

    return {
      id: String(t.id),
      date: String(t.transactionDate),
      type: t.type,
      source: t.type === "income" ? "Pemasukan Kas" : "Pengeluaran Kas",
      category: t.category,
      description: t.description || "-",
      amount: amt,
      receiptFile: t.receiptFile || null,
      recordedBy: t.creatorName || "Bendahara",
    };
  });

  const netChange = totalIncome - totalExpense;
  const endingBalance = openingBalance + netChange;

  // Build breakdown arrays
  const incomeBreakdown = Object.entries(incomeCatMap).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalIncome > 0 ? Math.round((amt / totalIncome) * 100) : 0,
  }));

  const expenseBreakdown = Object.entries(expenseCatMap).map(([cat, amt]) => ({
    category: cat,
    amount: amt,
    percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
  }));

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const periodLabel = month && month >= 1 && month <= 12
    ? `${monthNames[month - 1]} ${year}`
    : `Tahun ${year}`;

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
