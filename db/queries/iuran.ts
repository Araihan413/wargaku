import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, asc, desc } from 'drizzle-orm';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const createFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean().default(true),
});

export const updateFeeRuleSchema = z.object({
  name: z.string().min(1, 'Nama iuran wajib diisi'),
  amount: z.number().positive('Nominal iuran harus lebih dari 0'),
  isMandatory: z.boolean(),
});

export const payIuranSchema = z.object({
  amountPaid: z.number().positive('Nominal bayar harus lebih dari 0'),
  paymentMethod: z.enum(['cash', 'transfer']),
  paymentDate: z.string().min(1, 'Tanggal bayar wajib diisi'),
});

export type CreateFeeRuleInput = z.infer<typeof createFeeRuleSchema>;
export type UpdateFeeRuleInput = z.infer<typeof updateFeeRuleSchema>;
export type PayIuranInput = z.infer<typeof payIuranSchema>;

// ==========================================
// FEE RULES QUERIES
// ==========================================

/**
 * Mengambil semua aturan iuran, diurutkan dari yang terbaru.
 */
export async function listFeeRules() {
  const rules = await db
    .select()
    .from(schema.feeRules)
    .orderBy(desc(schema.feeRules.createdAt));

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    isMandatory: r.isMandatory,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Mengambil satu aturan iuran berdasarkan ID.
 * Mengembalikan null jika tidak ditemukan.
 */
export async function getFeeRuleById(id: number) {
  const [rule] = await db
    .select()
    .from(schema.feeRules)
    .where(eq(schema.feeRules.id, id))
    .limit(1);

  return rule ?? null;
}

/**
 * Membuat aturan iuran baru. Setelah dibuat, secara otomatis men-generate
 * tagihan untuk bulan berjalan bagi semua KK yang sudah terverifikasi.
 */
export async function createFeeRule(data: CreateFeeRuleInput, userId: string) {
  const { name, amount, isMandatory } = data;

  const [result] = await db.insert(schema.feeRules).values({
    rtId: userId,
    name,
    amount: String(amount),
    isMandatory,
    createdBy: userId,
  });

  const newId = result.insertId;

  // Auto-generate tagihan untuk bulan berjalan
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeFamilies = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(eq(schema.families.verificationStatus, 'verified'));

  for (const family of activeFamilies) {
    const existing = await db
      .select({ id: schema.feePayments.id })
      .from(schema.feePayments)
      .where(
        and(
          eq(schema.feePayments.feeRuleId, newId),
          eq(schema.feePayments.familyId, family.id),
          eq(schema.feePayments.period, period),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.feePayments).values({
        feeRuleId: newId,
        familyId: family.id,
        period,
        amountBilled: String(amount),
        amountPaid: '0.00',
        status: 'unpaid',
        isMandatory,
      });
    }
  }

  return { id: newId, period };
}

/**
 * Memperbarui aturan iuran. Melempar Error jika rule tidak ditemukan.
 */
export async function updateFeeRule(id: number, data: UpdateFeeRuleInput) {
  const existing = await getFeeRuleById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  await db
    .update(schema.feeRules)
    .set({ name: data.name, amount: String(data.amount), isMandatory: data.isMandatory, updatedAt: new Date() })
    .where(eq(schema.feeRules.id, id));
}

/**
 * Menghapus aturan iuran beserta seluruh data pembayarannya.
 * Melempar Error jika rule tidak ditemukan.
 */
export async function deleteFeeRule(id: number) {
  const existing = await getFeeRuleById(id);
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  // Hapus semua payment terkait terlebih dahulu
  await db.delete(schema.feePayments).where(eq(schema.feePayments.feeRuleId, id));
  await db.delete(schema.feeRules).where(eq(schema.feeRules.id, id));
}

// ==========================================
// GENERATE TAGIHAN QUERY
// ==========================================

/**
 * Men-generate tagihan iuran untuk bulan berjalan bagi semua KK terverifikasi.
 * Melewati KK yang sudah memiliki tagihan untuk periode dan rule yang sama.
 * Melempar Error jika rule tidak ditemukan.
 */
export async function generateTagihanForRule(ruleId: number) {
  const rule = await getFeeRuleById(ruleId);
  if (!rule) {
    throw new Error('NOT_FOUND');
  }

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeFamilies = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(eq(schema.families.verificationStatus, 'verified'));

  let generated = 0;
  let skipped = 0;

  for (const family of activeFamilies) {
    // Cek existing dengan filter yang benar: ruleId + familyId + period
    const existing = await db
      .select({ id: schema.feePayments.id })
      .from(schema.feePayments)
      .where(
        and(
          eq(schema.feePayments.feeRuleId, ruleId),
          eq(schema.feePayments.familyId, family.id),
          eq(schema.feePayments.period, period),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.feePayments).values({
        feeRuleId: ruleId,
        familyId: family.id,
        period,
        amountBilled: String(rule.amount),
        amountPaid: '0.00',
        status: 'unpaid',
        isMandatory: rule.isMandatory,
      });
      generated++;
    } else {
      skipped++;
    }
  }

  return { period, generated, skipped };
}

// ==========================================
// FEE PAYMENTS QUERIES
// ==========================================

/**
 * Mengambil daftar tagihan iuran berdasarkan ruleId, period (opsional),
 * dan query pencarian (opsional). Mengembalikan data rows + summary agregat.
 */
export async function listPayments(
  ruleId: number,
  period?: string | null,
  searchQuery?: string,
) {
  const conditions = [eq(schema.feePayments.feeRuleId, ruleId)];
  if (period) {
    conditions.push(eq(schema.feePayments.period, period));
  }

  const payments = await db
    .select({
      id: schema.feePayments.id,
      feeRuleId: schema.feePayments.feeRuleId,
      familyId: schema.feePayments.familyId,
      period: schema.feePayments.period,
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
      paymentDate: schema.feePayments.paymentDate,
      paymentMethod: schema.feePayments.paymentMethod,
      status: schema.feePayments.status,
      isMandatory: schema.feePayments.isMandatory,
      recordedBy: schema.feePayments.recordedBy,
      familyNumber: schema.families.familyNumber,
      headName: schema.families.headName,
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .innerJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(and(...conditions))
    .orderBy(asc(schema.dwellings.blockNumber), asc(schema.dwellings.houseNumber));

  const [feeRule] = await db
    .select({ name: schema.feeRules.name, amount: schema.feeRules.amount })
    .from(schema.feeRules)
    .where(eq(schema.feeRules.id, ruleId))
    .limit(1);

  const filtered = searchQuery
    ? payments.filter(
        (p) =>
          p.headName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.familyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.dwellingBlock.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : payments;

  const data = filtered.map((p) => ({
    id: p.id,
    feeRuleId: p.feeRuleId,
    feeRuleName: feeRule?.name ?? '',
    familyId: p.familyId,
    familyNumber: p.familyNumber,
    headName: p.headName,
    dwellingBlock: p.dwellingBlock,
    dwellingHouse: p.dwellingHouse,
    period: p.period,
    amountBilled: Number(p.amountBilled),
    amountPaid: Number(p.amountPaid),
    amountDue: Number(p.amountBilled) - Number(p.amountPaid),
    paymentDate: p.paymentDate,
    paymentMethod: p.paymentMethod,
    status: p.status,
    isMandatory: p.isMandatory,
    recordedBy: p.recordedBy,
  }));

  const summary = {
    total: data.length,
    paid: data.filter((p) => p.status === 'paid').length,
    partiallyPaid: data.filter((p) => p.status === 'partially_paid').length,
    unpaid: data.filter((p) => p.status === 'unpaid').length,
    totalCollected: data.reduce((s, p) => s + p.amountPaid, 0),
    totalDue: data.reduce((s, p) => s + p.amountDue, 0),
  };

  return { data, summary };
}

/**
 * Mencatat pembayaran iuran untuk satu record tagihan.
 * Secara otomatis menentukan status baru (unpaid/partially_paid/paid)
 * dan men-sync ke tabel kas (cashTransactions) sebagai income.
 * Melempar Error jika tagihan tidak ditemukan atau sudah lunas.
 */
export async function recordPayment(
  paymentId: number,
  input: PayIuranInput,
  userId: string,
) {
  const { amountPaid, paymentMethod, paymentDate } = input;

  const [existing] = await db
    .select({
      id: schema.feePayments.id,
      feeRuleId: schema.feePayments.feeRuleId,
      familyId: schema.feePayments.familyId,
      period: schema.feePayments.period,
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
      status: schema.feePayments.status,
      isMandatory: schema.feePayments.isMandatory,
      headName: schema.families.headName,
      ruleName: schema.feeRules.name,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
    .where(eq(schema.feePayments.id, paymentId))
    .limit(1);

  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  if (existing.status === 'paid') {
    throw new Error('ALREADY_PAID');
  }

  const currentPaid = Number(existing.amountPaid);
  const billed = Number(existing.amountBilled);
  const remaining = billed - currentPaid;

  if (amountPaid > remaining) {
    throw new Error(`OVERPAY:${remaining}`);
  }

  const newAmountPaid = currentPaid + amountPaid;
  const newStatus: 'unpaid' | 'partially_paid' | 'paid' =
    newAmountPaid >= billed ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : 'unpaid';

  const paymentDateObj = new Date(paymentDate);

  // Update record tagihan
  await db
    .update(schema.feePayments)
    .set({
      amountPaid: String(newAmountPaid),
      paymentDate: paymentDateObj,
      paymentMethod: paymentMethod as 'cash' | 'transfer',
      status: newStatus,
      recordedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(schema.feePayments.id, paymentId));

  // Sync ke kas: tambahkan ke cash_transactions sebagai income
  await db.insert(schema.cashTransactions).values({
    type: 'income',
    amount: String(amountPaid),
    transactionDate: paymentDateObj,
    category: 'Iuran Warga',
    description: `Iuran ${existing.ruleName} - ${existing.headName} - Periode ${existing.period}`,
    status: 'approved',
    createdBy: userId,
    approvedBy: userId,
  });

  return {
    newStatus,
    newAmountPaid,
    amountDue: billed - newAmountPaid,
  };
}

// ==========================================
// TUNGGAKAN QUERIES
// ==========================================

/**
 * Mengambil agregasi tunggakan iuran per KK (status unpaid atau partially_paid).
 * Dapat difilter berdasarkan ruleId. Mengembalikan data per KK + summary total.
 */
export async function listUnpaidByFamily(ruleId?: number | null) {
  const conditions = [
    ne(schema.feePayments.status, 'paid'),
    eq(schema.feePayments.isMandatory, true),
  ];

  if (ruleId) {
    conditions.push(eq(schema.feePayments.feeRuleId, ruleId));
  }

  const unpaidPayments = await db
    .select({
      id: schema.feePayments.id,
      feeRuleId: schema.feePayments.feeRuleId,
      familyId: schema.feePayments.familyId,
      period: schema.feePayments.period,
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
      status: schema.feePayments.status,
      familyNumber: schema.families.familyNumber,
      headName: schema.families.headName,
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .innerJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(and(...conditions))
    .orderBy(asc(schema.feePayments.familyId), asc(schema.feePayments.period));

  // Kelompokkan per keluarga
  const familyMap = new Map<
    number,
    {
      familyId: number;
      familyNumber: string;
      headName: string;
      dwellingBlock: string;
      dwellingHouse: string;
      totalUnpaid: number;
      unpaidMonths: number;
      latestPeriod: string;
      payments: {
        period: string;
        amountBilled: number;
        amountPaid: number;
        amountDue: number;
        status: 'unpaid' | 'partially_paid';
      }[];
    }
  >();

  for (const p of unpaidPayments) {
    const due = Number(p.amountBilled) - Number(p.amountPaid);
    if (!familyMap.has(p.familyId)) {
      familyMap.set(p.familyId, {
        familyId: p.familyId,
        familyNumber: p.familyNumber,
        headName: p.headName,
        dwellingBlock: p.dwellingBlock,
        dwellingHouse: p.dwellingHouse,
        totalUnpaid: 0,
        unpaidMonths: 0,
        latestPeriod: p.period,
        payments: [],
      });
    }

    const entry = familyMap.get(p.familyId)!;
    entry.totalUnpaid += due;
    entry.unpaidMonths += 1;
    if (p.period > entry.latestPeriod) entry.latestPeriod = p.period;
    entry.payments.push({
      period: p.period,
      amountBilled: Number(p.amountBilled),
      amountPaid: Number(p.amountPaid),
      amountDue: due,
      status: p.status as 'unpaid' | 'partially_paid',
    });
  }

  const data = Array.from(familyMap.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  const totalUnpaidRupiah = data.reduce((s, f) => s + f.totalUnpaid, 0);

  return {
    data,
    summary: {
      totalFamiliesWithArrears: data.length,
      totalUnpaidRupiah,
    },
  };
}
