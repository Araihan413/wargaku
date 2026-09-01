import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, asc, desc } from 'drizzle-orm';
import { decryptPII } from '@/lib/crypto-pii';
import { notifyUser } from '@/lib/notifications';

// ==========================================
// FEE RULES QUERIES
// ==========================================

export async function listFeeRules(includeInactive = true) {
  const query = db.select().from(schema.feeRules);
  const rules = includeInactive
    ? await query.orderBy(desc(schema.feeRules.isActive), desc(schema.feeRules.createdAt))
    : await query.where(eq(schema.feeRules.isActive, true)).orderBy(desc(schema.feeRules.createdAt));
  return rules.map((r) => ({ ...r, amount: Number(r.amount) }));
}

export async function getFeeRuleById(id: number) {
  const [rule] = await db.select().from(schema.feeRules).where(eq(schema.feeRules.id, id)).limit(1);
  return rule ?? null;
}

export async function createFeeRule(data: { name: string; amount: number; isMandatory?: boolean }, userId: string) {
  const [result] = await db.insert(schema.feeRules).values({
    name: data.name,
    amount: String(data.amount),
    isMandatory: true,
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

  if (activeFamilies.length > 0) {
    const existingPayments = await db
      .select({ familyId: schema.feePayments.familyId })
      .from(schema.feePayments)
      .where(and(eq(schema.feePayments.feeRuleId, newId), eq(schema.feePayments.period, period)));
    const existingSet = new Set(existingPayments.map((p) => p.familyId));

    const newRows = activeFamilies
      .filter((f) => !existingSet.has(f.id))
      .map((f) => ({
        feeRuleId: newId,
        familyId: f.id,
        period,
        amountBilled: String(data.amount),
        amountPaid: '0.00',
        status: 'unpaid' as const,
        isMandatory: true,
      }));

    if (newRows.length > 0) {
      await db.insert(schema.feePayments).values(newRows);
    }
  }

  return { id: newId, period };
}

export async function updateFeeRule(id: number, data: { name: string; amount: number; isMandatory?: boolean; isActive?: boolean }) {
  const updateData: any = {
    name: data.name,
    amount: String(data.amount),
    isMandatory: true,
    updatedAt: new Date(),
  };
  if (typeof data.isActive === 'boolean') {
    updateData.isActive = data.isActive;
  }

  await db
    .update(schema.feeRules)
    .set(updateData)
    .where(eq(schema.feeRules.id, id));

  return { id };
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
    // Soft Delete: Nonaktifkan aturan iuran agar tidak terbit lagi, bersihkan tagihan yang masih unpaid
    await db.delete(schema.feePayments).where(and(eq(schema.feePayments.feeRuleId, id), eq(schema.feePayments.status, 'unpaid')));
    await db.update(schema.feeRules).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.feeRules.id, id));
    return { id, softDeleted: true };
  } else {
    // Hard Delete: Jika belum ada warga yang membayar sama sekali, hapus total
    await db.delete(schema.feePayments).where(eq(schema.feePayments.feeRuleId, id));
    await db.delete(schema.feeRules).where(eq(schema.feeRules.id, id));
    return { id, softDeleted: false };
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

  const existingPayments = await db
    .select({ familyId: schema.feePayments.familyId })
    .from(schema.feePayments)
    .where(and(eq(schema.feePayments.feeRuleId, ruleId), eq(schema.feePayments.period, period)));
  const existingSet = new Set(existingPayments.map((p) => p.familyId));

  const toCreate = activeFamilies.filter((f) => !existingSet.has(f.id));
  const skipped = activeFamilies.length - toCreate.length;
  const newlyBilledHeadUserIds: string[] = [];

  if (toCreate.length > 0) {
    const rows = toCreate.map((f) => {
      if (f.headUserId) newlyBilledHeadUserIds.push(f.headUserId);
      return {
        feeRuleId: ruleId,
        familyId: f.id,
        period,
        amountBilled: String(rule.amount),
        amountPaid: '0.00',
        status: 'unpaid' as const,
        isMandatory: true,
      };
    });

    await db.insert(schema.feePayments).values(rows);
  }

  return {
    period,
    generated: toCreate.length,
    skipped,
    newlyBilledHeadUserIds,
    ruleName: rule.name,
    ruleAmount: rule.amount,
    isMandatory: true,
  };
}

/**
 * Otomatisasi Penerbitan Tagihan Bulan Berjalan (Lazy / Just-In-Time)
 * Memastikan semua KK aktif memiliki tagihan bulan ini untuk setiap aturan iuran yang aktif.
 */
export async function ensureCurrentMonthFeesGenerated() {
  try {
    const activeRules = await db
      .select({ id: schema.feeRules.id })
      .from(schema.feeRules)
      .where(eq(schema.feeRules.isActive, true));

    if (activeRules.length === 0) return { generatedTotal: 0 };

    let generatedTotal = 0;
    for (const r of activeRules) {
      const res = await generateTagihanForRule(r.id);
      generatedTotal += res.generated;

      if (res.generated > 0 && res.newlyBilledHeadUserIds.length > 0) {
        const formattedAmount = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(Number(res.ruleAmount));

        const title = 'Tagihan Iuran Baru';
        const message = `Tagihan Iuran "${res.ruleName}" periode ${res.period} sebesar ${formattedAmount} telah diterbitkan. Mohon lakukan pembayaran.`;

        for (const headUserId of res.newlyBilledHeadUserIds) {
          notifyUser(headUserId, {
            title,
            message,
            category: 'personal',
            redirectLink: '/dashboard/finance',
          }).catch((err) => console.error('[Auto-Billing] Gagal kirim notif:', err));
        }
      }
    }

    return { generatedTotal };
  } catch (err) {
    console.error('[ensureCurrentMonthFeesGenerated] Error:', err);
    return { generatedTotal: 0 };
  }
}

// ==========================================
// FEE PAYMENTS QUERIES
// ==========================================

export async function listPayments(ruleId: number, period?: string | null, searchQuery?: string) {
  // Pastikan tagihan bulan berjalan sudah dibuat otomatis jika belum ada
  await ensureCurrentMonthFeesGenerated();

  const isAllPeriod = period === 'all' || !period;

  // Ambil data pembayaran
  const conditions: any[] = [
    eq(schema.feePayments.feeRuleId, ruleId),
    eq(schema.families.isActive, true),
  ];
  if (!isAllPeriod && period) {
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
      headName: schema.users.name,
      dwellingBlock: schema.dwellings.blockNumber,
      dwellingHouse: schema.dwellings.houseNumber,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(and(...conditions))
    .orderBy(desc(schema.feePayments.period), asc(schema.dwellings.blockNumber), asc(schema.dwellings.houseNumber));

  const [feeRule] = await db
    .select({ name: schema.feeRules.name, amount: schema.feeRules.amount })
    .from(schema.feeRules)
    .where(eq(schema.feeRules.id, ruleId))
    .limit(1);

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Ambil semua tagihan unpaid untuk menghitung total tunggakan dan rincian unpaidBills per keluarga
  const allUnpaid = await db
    .select({
      familyId: schema.feePayments.familyId,
      period: schema.feePayments.period,
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
    })
    .from(schema.feePayments)
    .where(and(eq(schema.feePayments.feeRuleId, ruleId), ne(schema.feePayments.status, 'paid')))
    .orderBy(asc(schema.feePayments.period));

  const unpaidBillsMap = new Map<number, { period: string; amountBilled: number; amountPaid: number; amountDue: number }[]>();
  const arrearsMap = new Map<number, { count: number; totalDue: number; periods: string[] }>();
  for (const u of allUnpaid) {
    const billed = Number(u.amountBilled);
    const paid = Number(u.amountPaid);
    const due = billed - paid;

    // Catat seluruh tagihan yang belum lunas (termasuk parsial advance) ke unpaidBillsMap
    const existingBills = unpaidBillsMap.get(u.familyId) || [];
    existingBills.push({ period: u.period, amountBilled: billed, amountPaid: paid, amountDue: due });
    unpaidBillsMap.set(u.familyId, existingBills);

    if (u.period <= currentPeriod) {
      const existing = arrearsMap.get(u.familyId) || { count: 0, totalDue: 0, periods: [] };
      existing.count += 1;
      existing.totalDue += due;
      existing.periods.push(u.period);
      arrearsMap.set(u.familyId, existing);
    }
  }

  // Ambil periode lunas terjauh untuk setiap KK
  const latestPaid = await db
    .select({
      familyId: schema.feePayments.familyId,
      period: schema.feePayments.period,
    })
    .from(schema.feePayments)
    .where(and(eq(schema.feePayments.feeRuleId, ruleId), eq(schema.feePayments.status, 'paid')))
    .orderBy(desc(schema.feePayments.period));

  const latestPaidMap = new Map<number, string>();
  for (const lp of latestPaid) {
    if (!latestPaidMap.has(lp.familyId)) {
      latestPaidMap.set(lp.familyId, lp.period);
    }
  }

  const filtered = searchQuery
    ? payments.filter((p) => {
        const decryptedFamilyNumber = decryptPII(p.familyNumber);
        return (
          (p.headName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          decryptedFamilyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.dwellingBlock ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : payments;

  // Jika isAllPeriod, kelompokkan per KK dan AKUMULASIKAN seluruh periode untuk KK tersebut
  let finalRows: any[] = [];
  if (isAllPeriod) {
    const familyAggregation = new Map<number, {
      latestPaymentRow: typeof filtered[0];
      totalBilled: number;
      totalPaid: number;
    }>();

    for (const p of filtered) {
      const isPastOrCurrent = p.period <= currentPeriod;
      const billedNum = Number(p.amountBilled);
      const paidNum = Number(p.amountPaid);

      const existing = familyAggregation.get(p.familyId);
      if (!existing) {
        familyAggregation.set(p.familyId, {
          latestPaymentRow: p,
          totalBilled: isPastOrCurrent ? billedNum : 0,
          totalPaid: paidNum,
        });
      } else {
        if (isPastOrCurrent) {
          existing.totalBilled += billedNum;
        }
        existing.totalPaid += paidNum;
      }
    }

    finalRows = Array.from(familyAggregation.values()).map((agg) => {
      const p = agg.latestPaymentRow;
      const amountBilled = agg.totalBilled;
      const amountPaid = agg.totalPaid;
      const amountDue = Math.max(0, amountBilled - amountPaid);
      const status: 'paid' | 'partially_paid' | 'unpaid' =
        amountDue <= 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';

      return {
        ...p,
        amountBilled,
        amountPaid,
        amountDue,
        status,
      };
    });
  } else {
    finalRows = filtered.map((p) => ({
      ...p,
      amountBilled: Number(p.amountBilled),
      amountPaid: Number(p.amountPaid),
      amountDue: Number(p.amountBilled) - Number(p.amountPaid),
    }));
  }

  const data = finalRows.map((p) => {
    const arrears = arrearsMap.get(p.familyId) || { count: 0, totalDue: 0, periods: [] };
    const paidUntil = latestPaidMap.get(p.familyId) || null;
    const isAdvance = paidUntil ? paidUntil > currentPeriod : false;

    // Pisahkan secara presisi: bulan lampau (tunggakan murni) vs bulan berjalan
    const pastUnpaidPeriods = arrears.periods.filter((prd) => prd < currentPeriod);
    const pastArrearsCount = pastUnpaidPeriods.length;
    const hasCurrentMonthUnpaid = arrears.periods.includes(currentPeriod);

    return {
      id: p.id,
      feeRuleId: p.feeRuleId,
      feeRuleName: feeRule?.name ?? '',
      ruleMonthlyAmount: Number(feeRule?.amount ?? 0),
      familyId: p.familyId,
      familyNumber: decryptPII(p.familyNumber),
      headName: p.headName ?? '',
      dwellingBlock: p.dwellingBlock ?? '-',
      dwellingHouse: p.dwellingHouse ?? '-',
      period: isAllPeriod ? 'Semua Periode' : p.period,
      amountBilled: p.amountBilled,
      amountPaid: p.amountPaid,
      amountDue: p.amountDue,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      status: p.status,
      isMandatory: p.isMandatory,
      recordedBy: p.recordedBy,
      // Metadata tambahan untuk UI cerdas
      unpaidMonthsCount: arrears.count,
      pastArrearsCount,
      hasCurrentMonthUnpaid,
      pastUnpaidPeriods,
      totalArrears: arrears.totalDue,
      unpaidPeriods: arrears.periods,
      paidUntilPeriod: paidUntil,
      isAdvancePaid: isAdvance,
      unpaidBills: unpaidBillsMap.get(p.familyId) || [],
    };
  });

  const summary = {
    total: data.length,
    paid: data.filter((p) => p.status === 'paid').length,
    partiallyPaid: data.filter((p) => p.status === 'partially_paid').length,
    unpaid: data.filter((p) => p.status === 'unpaid').length,
    totalCollected: data.reduce((s, p) => s + p.amountPaid, 0),
    totalDue: data.reduce((s, p) => s + p.amountDue, 0),
    totalArrearsOverall: Array.from(arrearsMap.values()).reduce((sum, a) => sum + a.totalDue, 0),
  };

  return { data, summary };
}

export interface BatchPaymentInput {
  familyId: number;
  feeRuleId: number;
  amountPaid: number;
  paymentMethod: 'cash' | 'transfer';
  paymentDate: string;
}

export async function recordBatchMultiMonthPayment(input: BatchPaymentInput, userId: string) {
  const { familyId, feeRuleId, amountPaid, paymentMethod, paymentDate } = input;
  if (amountPaid <= 0) throw new Error('INVALID_AMOUNT');

  // 1. Ambil info aturan iuran & keluarga
  const [feeRule] = await db
    .select()
    .from(schema.feeRules)
    .where(eq(schema.feeRules.id, feeRuleId))
    .limit(1);
  if (!feeRule || !feeRule.isActive) throw new Error('RULE_NOT_FOUND_OR_INACTIVE');

  const [family] = await db
    .select({
      id: schema.families.id,
      headUserId: schema.families.headUserId,
      headName: schema.users.name,
    })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(and(eq(schema.families.id, familyId), eq(schema.families.isActive, true)))
    .limit(1);
  if (!family) throw new Error('FAMILY_NOT_FOUND');

  const ruleMonthlyAmount = Number(feeRule.amount);
  const paymentDateObj = new Date(paymentDate);

  // 2. Ambil semua tagihan unpaid / partially_paid yang ada saat ini (diurutkan periode terlama lebih dulu)
  const unpaidExisting = await db
    .select()
    .from(schema.feePayments)
    .where(
      and(
        eq(schema.feePayments.familyId, familyId),
        eq(schema.feePayments.feeRuleId, feeRuleId),
        ne(schema.feePayments.status, 'paid')
      )
    )
    .orderBy(asc(schema.feePayments.period));

  let remainingMoney = amountPaid;
  const paidPeriods: string[] = [];
  const partiallyPaidPeriods: string[] = [];

  await db.transaction(async (tx) => {
    // 3. Alokasikan ke tagihan unpaid / partially_paid yang sudah ada (tunggakan / bulan ini)
    for (const bill of unpaidExisting) {
      if (remainingMoney <= 0) break;
      const billed = Number(bill.amountBilled);
      const currentPaid = Number(bill.amountPaid);
      const due = billed - currentPaid;

      if (remainingMoney >= due) {
        // Lunasi tagihan ini penuh
        await tx
          .update(schema.feePayments)
          .set({
            amountPaid: String(billed),
            paymentDate: paymentDateObj,
            paymentMethod,
            status: 'paid',
            recordedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(schema.feePayments.id, bill.id));
        remainingMoney -= due;
        paidPeriods.push(bill.period);
      } else {
        // Bayar sebagian
        const newPaid = currentPaid + remainingMoney;
        await tx
          .update(schema.feePayments)
          .set({
            amountPaid: String(newPaid),
            paymentDate: paymentDateObj,
            paymentMethod,
            status: 'partially_paid',
            recordedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(schema.feePayments.id, bill.id));
        remainingMoney = 0;
        partiallyPaidPeriods.push(bill.period);
      }
    }

    // 4. Jika masih ada sisa uang setelah semua tagihan terdaftar lunas, buat tagihan bulan-bulan berikutnya (Advance)
    if (remainingMoney > 0) {
      // Cari periode tagihan terakhir yang pernah ada untuk KK ini
      const [latestBill] = await tx
        .select({ period: schema.feePayments.period })
        .from(schema.feePayments)
        .where(and(eq(schema.feePayments.familyId, familyId), eq(schema.feePayments.feeRuleId, feeRuleId)))
        .orderBy(desc(schema.feePayments.period))
        .limit(1);

      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let nextPeriodStr = latestBill?.period && latestBill.period >= currentPeriod ? latestBill.period : currentPeriod;

      while (remainingMoney > 0) {
        // Hitung 1 bulan ke depan dari nextPeriodStr
        const [year, month] = nextPeriodStr.split('-').map(Number);
        const nextDate = new Date(year, month, 1);
        nextPeriodStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

        // Cek apakah tagihan periode ini sudah ada
        const [existingNext] = await tx
          .select({ id: schema.feePayments.id })
          .from(schema.feePayments)
          .where(
            and(
              eq(schema.feePayments.familyId, familyId),
              eq(schema.feePayments.feeRuleId, feeRuleId),
              eq(schema.feePayments.period, nextPeriodStr)
            )
          )
          .limit(1);

        if (existingNext) continue;

        if (remainingMoney >= ruleMonthlyAmount) {
          // Buat tagihan advance LUNAS
          await tx.insert(schema.feePayments).values({
            feeRuleId,
            familyId,
            period: nextPeriodStr,
            amountBilled: String(ruleMonthlyAmount),
            amountPaid: String(ruleMonthlyAmount),
            paymentDate: paymentDateObj,
            paymentMethod,
            status: 'paid',
            isMandatory: feeRule.isMandatory,
            recordedBy: userId,
          });
          remainingMoney -= ruleMonthlyAmount;
          paidPeriods.push(nextPeriodStr);
        } else {
          // Buat tagihan advance KURANG BAYAR
          await tx.insert(schema.feePayments).values({
            feeRuleId,
            familyId,
            period: nextPeriodStr,
            amountBilled: String(ruleMonthlyAmount),
            amountPaid: String(remainingMoney),
            paymentDate: paymentDateObj,
            paymentMethod,
            status: 'partially_paid',
            isMandatory: feeRule.isMandatory,
            recordedBy: userId,
          });
          remainingMoney = 0;
          partiallyPaidPeriods.push(nextPeriodStr);
        }
      }
    }

    // 5. Catat 1 transaksi kas masuk ke Buku Kas RT (Sinkronisasi Kas)
    const allMonthsCount = paidPeriods.length + partiallyPaidPeriods.length;
    const periodDesc =
      allMonthsCount > 1
        ? `${paidPeriods[0] || partiallyPaidPeriods[0]} s/d ${paidPeriods[paidPeriods.length - 1] || partiallyPaidPeriods[partiallyPaidPeriods.length - 1]}`
        : paidPeriods[0] || partiallyPaidPeriods[0] || 'Periode Baru';

    await tx.insert(schema.cashTransactions).values({
      type: 'income',
      amount: String(amountPaid),
      transactionDate: paymentDateObj,
      category: 'Iuran Warga',
      description: `Iuran ${feeRule.name} - ${family.headName ?? 'Warga'} (${allMonthsCount} Bulan: ${periodDesc})`,
      status: 'approved',
      createdBy: userId,
      approvedBy: userId,
    });
  });

  return {
    success: true,
    familyId,
    headUserId: family.headUserId,
    headName: family.headName,
    ruleName: feeRule.name,
    amountPaid,
    paidPeriods,
    partiallyPaidPeriods,
    totalMonthsCovered: paidPeriods.length + partiallyPaidPeriods.length,
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
