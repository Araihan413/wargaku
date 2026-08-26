import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, asc, desc } from 'drizzle-orm';
import { decryptPII } from '@/lib/crypto-pii';

// ==========================================
// FEE RULES QUERIES
// ==========================================

export async function listFeeRules(includeInactive = false) {
  const query = db.select().from(schema.feeRules);
  const rules = includeInactive
    ? await query.orderBy(desc(schema.feeRules.createdAt))
    : await query.where(eq(schema.feeRules.isActive, true)).orderBy(desc(schema.feeRules.createdAt));
  return rules.map((r) => ({ ...r, amount: Number(r.amount) }));
}

export async function getFeeRuleById(id: number) {
  const [rule] = await db.select().from(schema.feeRules).where(eq(schema.feeRules.id, id)).limit(1);
  return rule ?? null;
}

export async function createFeeRule(data: { name: string; amount: number; isMandatory: boolean }, userId: string) {
  const [result] = await db.insert(schema.feeRules).values({
    name: data.name,
    amount: String(data.amount),
    isMandatory: data.isMandatory,
    createdBy: userId,
  });

  const newId = result.insertId;

  // Auto-generate tagihan untuk bulan berjalan
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeFamilies = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified')));

  for (const family of activeFamilies) {
    const [existing] = await db
      .select({ id: schema.feePayments.id })
      .from(schema.feePayments)
      .where(and(eq(schema.feePayments.feeRuleId, newId), eq(schema.feePayments.familyId, family.id), eq(schema.feePayments.period, period)))
      .limit(1);

    if (!existing) {
      await db.insert(schema.feePayments).values({
        feeRuleId: newId,
        familyId: family.id,
        period,
        amountBilled: String(data.amount),
        amountPaid: '0.00',
        status: 'unpaid',
        isMandatory: data.isMandatory,
      });
    }
  }

  return { id: newId, period };
}

export async function updateFeeRule(id: number, data: { name: string; amount: number; isMandatory: boolean }) {
  const existing = await getFeeRuleById(id);
  if (!existing) throw new Error('NOT_FOUND');
  await db
    .update(schema.feeRules)
    .set({ name: data.name, amount: String(data.amount), isMandatory: data.isMandatory, updatedAt: new Date() })
    .where(eq(schema.feeRules.id, id));
}

export async function deleteFeeRule(id: number) {
  const existing = await getFeeRuleById(id);
  if (!existing) throw new Error('NOT_FOUND');

  // Cek apakah ada transaksi warga yang sudah membayar (status paid atau partially_paid)
  const [hasPaidTransaction] = await db
    .select({ id: schema.feePayments.id })
    .from(schema.feePayments)
    .where(and(eq(schema.feePayments.feeRuleId, id), ne(schema.feePayments.status, 'unpaid')))
    .limit(1);

  if (hasPaidTransaction) {
    // Soft Delete: Nonaktifkan aturan iuran agar tidak terbit lagi, namun simpan riwayat pembayaran warga
    await db.delete(schema.feePayments).where(and(eq(schema.feePayments.feeRuleId, id), eq(schema.feePayments.status, 'unpaid')));
    await db.update(schema.feeRules).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.feeRules.id, id));
    return { softDeleted: true };
  } else {
    // Hard Delete: Jika belum ada warga yang membayar sama sekali, hapus total
    await db.delete(schema.feePayments).where(eq(schema.feePayments.feeRuleId, id));
    await db.delete(schema.feeRules).where(eq(schema.feeRules.id, id));
    return { softDeleted: false };
  }
}

export async function generateTagihanForRule(ruleId: number) {
  const rule = await getFeeRuleById(ruleId);
  if (!rule || !rule.isActive) throw new Error('RULE_INACTIVE');

  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const activeFamilies = await db
    .select({ id: schema.families.id, headUserId: schema.families.headUserId })
    .from(schema.families)
    .where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified')));

  let generated = 0;
  let skipped = 0;
  const newlyBilledHeadUserIds: string[] = [];

  for (const family of activeFamilies) {
    const [existing] = await db
      .select({ id: schema.feePayments.id })
      .from(schema.feePayments)
      .where(and(eq(schema.feePayments.feeRuleId, ruleId), eq(schema.feePayments.familyId, family.id), eq(schema.feePayments.period, period)))
      .limit(1);

    if (!existing) {
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
      if (family.headUserId) {
        newlyBilledHeadUserIds.push(family.headUserId);
      }
    } else {
      skipped++;
    }
  }

  return {
    period,
    generated,
    skipped,
    newlyBilledHeadUserIds,
    ruleName: rule.name,
    ruleAmount: rule.amount,
    isMandatory: rule.isMandatory,
  };
}

// ==========================================
// FEE PAYMENTS QUERIES
// ==========================================

export async function listPayments(ruleId: number, period?: string | null, searchQuery?: string) {
  const conditions: any[] = [
    eq(schema.feePayments.feeRuleId, ruleId),
    eq(schema.families.isActive, true),
  ];
  if (period) conditions.push(eq(schema.feePayments.period, period));

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
      headName: schema.users.name,  // Ambil dari users via headUserId
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(and(...conditions))
    .orderBy(asc(schema.dwellings.blockNumber), asc(schema.dwellings.houseNumber));

  const [feeRule] = await db
    .select({ name: schema.feeRules.name, amount: schema.feeRules.amount })
    .from(schema.feeRules)
    .where(eq(schema.feeRules.id, ruleId))
    .limit(1);

  const filtered = searchQuery
    ? payments.filter(
        (p) => {
          const decryptedFamilyNumber = decryptPII(p.familyNumber);
          return (
            (p.headName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            decryptedFamilyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.dwellingBlock ?? '').toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      )
    : payments;

  const data = filtered.map((p) => ({
    id: p.id,
    feeRuleId: p.feeRuleId,
    feeRuleName: feeRule?.name ?? '',
    familyId: p.familyId,
    familyNumber: decryptPII(p.familyNumber),
    headName: p.headName ?? '',
    dwellingBlock: p.dwellingBlock ?? '-',
    dwellingHouse: p.dwellingHouse ?? '-',
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

export async function recordPayment(
  paymentId: number,
  input: { amountPaid: number; paymentMethod: 'cash' | 'transfer'; paymentDate: string },
  userId: string
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
      headUserId: schema.families.headUserId,
      headName: schema.users.name,
      ruleName: schema.feeRules.name,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
    .where(eq(schema.feePayments.id, paymentId))
    .limit(1);

  if (!existing) throw new Error('NOT_FOUND');
  if (existing.status === 'paid') throw new Error('ALREADY_PAID');

  const currentPaid = Number(existing.amountPaid);
  const billed = Number(existing.amountBilled);
  const remaining = billed - currentPaid;

  if (amountPaid > remaining) throw new Error(`OVERPAY:${remaining}`);

  const newAmountPaid = currentPaid + amountPaid;
  const newStatus: 'unpaid' | 'partially_paid' | 'paid' =
    newAmountPaid >= billed ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : 'unpaid';

  const paymentDateObj = new Date(paymentDate);

  await db
    .update(schema.feePayments)
    .set({
      amountPaid: String(newAmountPaid),
      paymentDate: paymentDateObj,
      paymentMethod,
      status: newStatus,
      recordedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(schema.feePayments.id, paymentId));

  // Sync ke kas
  await db.insert(schema.cashTransactions).values({
    type: 'income',
    amount: String(amountPaid),
    transactionDate: paymentDateObj,
    category: 'Iuran Warga',
    description: `Iuran ${existing.ruleName} - ${existing.headName ?? ''} - Periode ${existing.period}`,
    status: 'approved',
    createdBy: userId,
    approvedBy: userId,
  });

  return {
    newStatus,
    newAmountPaid,
    amountDue: billed - newAmountPaid,
    headUserId: existing.headUserId,
    period: existing.period,
    ruleName: existing.ruleName,
  };
}

export async function listUnpaidByFamily(ruleId?: number | null) {
  const conditions: any[] = [
    ne(schema.feePayments.status, 'paid'),
    eq(schema.feePayments.isMandatory, true),
    eq(schema.families.isActive, true),
    eq(schema.families.verificationStatus, 'verified'),
  ];
  if (ruleId) conditions.push(eq(schema.feePayments.feeRuleId, ruleId));

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
      headName: schema.users.name,
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(and(...conditions))
    .orderBy(asc(schema.feePayments.familyId), asc(schema.feePayments.period));

  const familyMap = new Map<number, {
    familyId: number;
    familyNumber: string;
    headName: string;
    dwellingBlock: string;
    dwellingHouse: string;
    totalUnpaid: number;
    unpaidMonths: number;
    latestPeriod: string;
    payments: { period: string; amountBilled: number; amountPaid: number; amountDue: number; status: 'unpaid' | 'partially_paid' }[];
  }>();

  for (const p of unpaidPayments) {
    const due = Number(p.amountBilled) - Number(p.amountPaid);
    if (!familyMap.has(p.familyId)) {
      familyMap.set(p.familyId, {
        familyId: p.familyId,
        familyNumber: decryptPII(p.familyNumber),
        headName: p.headName ?? '',
        dwellingBlock: p.dwellingBlock ?? '-',
        dwellingHouse: p.dwellingHouse ?? '-',
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
    entry.payments.push({ period: p.period, amountBilled: Number(p.amountBilled), amountPaid: Number(p.amountPaid), amountDue: due, status: p.status as 'unpaid' | 'partially_paid' });
  }

  const data = Array.from(familyMap.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  return {
    data,
    summary: { totalFamiliesWithArrears: data.length, totalUnpaidRupiah: data.reduce((s, f) => s + f.totalUnpaid, 0) },
  };
}
