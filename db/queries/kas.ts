import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, desc, sql, gte, lte } from "drizzle-orm";
import { z } from "zod";

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const createIncomeSchema = z.object({
  amount: z.number().positive("Nominal pemasukan harus lebih dari 0"),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  category: z.string().min(1, "Kategori pemasukan wajib diisi"),
  description: z.string().optional().nullable(),
  receiptFile: z.string().optional().nullable(),
});

export const updateIncomeSchema = z.object({
  amount: z.number().positive("Nominal pemasukan harus lebih dari 0"),
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  category: z.string().min(1, "Kategori pemasukan wajib diisi"),
  description: z.string().optional().nullable(),
  receiptFile: z.string().optional().nullable(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive("Nominal pengeluaran harus lebih dari 0"),
  transactionDate: z.string().min(1, "Tanggal pengeluaran wajib diisi"),
  category: z.string().min(1, "Kategori pengeluaran wajib diisi"),
  description: z.string().min(1, "Judul / Keperluan pengeluaran wajib diisi"),
  receiptFile: z.string().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive("Nominal pengeluaran harus lebih dari 0"),
  transactionDate: z.string().min(1, "Tanggal pengeluaran wajib diisi"),
  category: z.string().min(1, "Kategori pengeluaran wajib diisi"),
  description: z.string().min(1, "Judul / Keperluan pengeluaran wajib diisi"),
  receiptFile: z.string().optional().nullable(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export interface ListCashTransactionsOptions {
  type: "income" | "expense";
  limit?: number;
  offset?: number;
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// ==========================================
// KAS TRANSACTIONS QUERIES
// ==========================================

export async function listCashTransactions(options: ListCashTransactionsOptions) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions = [eq(schema.cashTransactions.type, options.type)];

  if (options.category) {
    conditions.push(eq(schema.cashTransactions.category, options.category));
  }

  if (options.query) {
    conditions.push(
      or(
        like(schema.cashTransactions.description, `%${options.query}%`),
        like(schema.cashTransactions.category, `%${options.query}%`)
      )!
    );
  }

  if (options.startDate) {
    conditions.push(gte(schema.cashTransactions.transactionDate, new Date(options.startDate)));
  }

  if (options.endDate) {
    conditions.push(lte(schema.cashTransactions.transactionDate, new Date(options.endDate)));
  }

  const whereClause = and(...conditions);

  const [totalCountResult] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
      totalAmount: sql<number>`COALESCE(SUM(${schema.cashTransactions.amount}), 0)`.mapWith(Number),
    })
    .from(schema.cashTransactions)
    .where(whereClause);

  const items = await db
    .select({
      id: schema.cashTransactions.id,
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      transactionDate: schema.cashTransactions.transactionDate,
      category: schema.cashTransactions.category,
      description: schema.cashTransactions.description,
      receiptFile: schema.cashTransactions.receiptFile,
      status: schema.cashTransactions.status,
      createdBy: schema.cashTransactions.createdBy,
      creatorName: schema.users.name,
      createdAt: schema.cashTransactions.createdAt,
      updatedAt: schema.cashTransactions.updatedAt,
    })
    .from(schema.cashTransactions)
    .leftJoin(schema.users, eq(schema.cashTransactions.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.cashTransactions.transactionDate), desc(schema.cashTransactions.id))
    .limit(limit)
    .offset(offset);

  const formattedItems = items.map((i) => ({
    ...i,
    amount: Number(i.amount),
    transactionDate: String(i.transactionDate),
  }));

  return {
    data: formattedItems,
    metadata: {
      total: totalCountResult?.count || 0,
      totalAmount: totalCountResult?.totalAmount || 0,
      limit,
      offset,
    },
  };
}

export async function createCashTransaction(
  type: "income" | "expense",
  validated: CreateIncomeInput | CreateExpenseInput,
  userId: string
) {
  const [insertResult] = await db.insert(schema.cashTransactions).values({
    type,
    amount: String(validated.amount),
    transactionDate: new Date(validated.transactionDate),
    category: validated.category,
    description: validated.description || null,
    receiptFile: validated.receiptFile || null,
    status: "approved",
    createdBy: userId,
    approvedBy: userId,
  });

  return insertResult.insertId;
}

export async function updateCashTransaction(
  id: number,
  type: "income" | "expense",
  validated: UpdateIncomeInput | UpdateExpenseInput
) {
  const [existing] = await db
    .select()
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.id, id), eq(schema.cashTransactions.type, type)))
    .limit(1);

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  await db
    .update(schema.cashTransactions)
    .set({
      amount: String(validated.amount),
      transactionDate: new Date(validated.transactionDate),
      category: validated.category,
      description: validated.description || null,
      receiptFile: validated.receiptFile !== undefined ? validated.receiptFile : existing.receiptFile,
      updatedAt: new Date(),
    })
    .where(eq(schema.cashTransactions.id, id));
}

export async function deleteCashTransaction(id: number, type: "income" | "expense") {
  const [existing] = await db
    .select()
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.id, id), eq(schema.cashTransactions.type, type)))
    .limit(1);

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  await db.delete(schema.cashTransactions).where(eq(schema.cashTransactions.id, id));
}
