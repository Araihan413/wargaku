import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, gte, lte } from 'drizzle-orm';
import { deleteCloudinaryFileByUrl } from '@/lib/cloudinary';
export {
  createIncomeSchema,
  updateIncomeSchema,
  createExpenseSchema,
  updateExpenseSchema,
} from '@/lib/validations/keuangan';

export interface ListCashTransactionsOptions {
  type: 'income' | 'expense';
  limit?: number;
  offset?: number;
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export async function listCashTransactions(options: ListCashTransactionsOptions) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [eq(schema.cashTransactions.type, options.type)];
  if (options.category) conditions.push(eq(schema.cashTransactions.category, options.category));
  if (options.query) {
    conditions.push(
      or(like(schema.cashTransactions.description, `%${options.query}%`), like(schema.cashTransactions.category, `%${options.query}%`))!
    );
  }
  if (options.startDate) conditions.push(gte(schema.cashTransactions.transactionDate, new Date(options.startDate)));
  if (options.endDate) conditions.push(lte(schema.cashTransactions.transactionDate, new Date(options.endDate)));

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

  return {
    items,
    metadata: {
      total: Number(totalCountResult?.count ?? 0),
      totalAmount: Number(totalCountResult?.totalAmount ?? 0),
      limit,
      offset,
    },
  };
}

export async function createCashTransaction(
  data: {
    type: 'income' | 'expense';
    amount: number;
    transactionDate: Date;
    category: string;
    description: string;
    receiptFile?: string | null;
    createdBy: string;
    approvedBy?: string | null;
  }
) {
  const [result] = await db.insert(schema.cashTransactions).values({
    type: data.type,
    amount: String(data.amount) as any,
    transactionDate: data.transactionDate,
    category: data.category,
    description: data.description,
    receiptFile: data.receiptFile ?? null,
    status: 'approved',
    createdBy: data.createdBy,
    approvedBy: data.approvedBy ?? data.createdBy,
  });
  return result.insertId;
}

export async function getCashTransactionById(id: number) {
  const [item] = await db
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
    .where(eq(schema.cashTransactions.id, id))
    .limit(1);

  return item ?? null;
}

export async function updateCashTransaction(
  id: number,
  data: {
    amount?: number;
    transactionDate?: Date;
    category?: string;
    description?: string;
    receiptFile?: string | null;
  }
) {
  const [existing] = await db
    .select({ receiptFile: schema.cashTransactions.receiptFile })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.id, id));

  const updatePayload: any = { updatedAt: new Date() };
  if (data.amount !== undefined) updatePayload.amount = String(data.amount);
  if (data.transactionDate !== undefined) updatePayload.transactionDate = data.transactionDate;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.receiptFile !== undefined) updatePayload.receiptFile = data.receiptFile;

  await db.update(schema.cashTransactions).set(updatePayload).where(eq(schema.cashTransactions.id, id));

  if (existing?.receiptFile && data.receiptFile !== undefined && existing.receiptFile !== data.receiptFile) {
    deleteCloudinaryFileByUrl(existing.receiptFile).catch((err) =>
      console.error("[Cloudinary Cleanup] Gagal menghapus nota kas lama:", err)
    );
  }

  return true;
}

export async function deleteCashTransaction(id: number) {
  const [existing] = await db
    .select({ receiptFile: schema.cashTransactions.receiptFile })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.id, id));

  await db.delete(schema.cashTransactions).where(eq(schema.cashTransactions.id, id));

  if (existing?.receiptFile) {
    deleteCloudinaryFileByUrl(existing.receiptFile).catch((err) =>
      console.error("[Cloudinary Cleanup] Gagal menghapus nota kas:", err)
    );
  }

  return true;
}
