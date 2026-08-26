import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { decryptPII } from '@/lib/crypto-pii';


export interface WargaFeeSummary {
  hasFamily: boolean;
  familyId: number | null;
  familyNumber: string | null;
  currentPeriod: string;
  currentMonthStatus: 'paid' | 'partially_paid' | 'unpaid';
  currentMonthBilled: number;
  currentMonthPaid: number;
  currentMonthRemaining: number;
  previousMonthsUnpaidBalance: number;
  totalUnpaidBalance: number;
  totalPaidThisYear: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  lastPaymentStatus: string | null;
  lastPaymentRuleName: string | null;
  activeRules: Array<{
    id: number;
    name: string;
    amount: number;
    isMandatory: boolean;
  }>;
  history: Array<{
    id: number;
    feeRuleId: number;
    feeRuleName: string;
    period: string;
    amountBilled: number;
    amountPaid: number;
    paymentDate: string | null;
    paymentMethod: 'cash' | 'transfer' | null;
    status: 'unpaid' | 'partially_paid' | 'paid';
    isMandatory: boolean;
    recordedByName: string | null;
    createdAt: string;
  }>;
}

/**
 * Mengambil ringkasan & histori pembayaran iuran (Strict Read-Only) untuk keluarga Warga.
 */
export async function getMyFamilyFees(userId: string): Promise<WargaFeeSummary> {
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const currentYearPrefix = new Date().getFullYear().toString();

  // 1. Cari keluarga milik user (sebagai kepala keluarga atau anggota)
  const [headFamily] = await db
    .select({ id: schema.families.id, familyNumber: schema.families.familyNumber })
    .from(schema.families)
    .where(eq(schema.families.headUserId, userId))
    .limit(1);

  let familyId: number | null = headFamily?.id ?? null;
  let familyNumber: string | null = headFamily?.familyNumber ? decryptPII(headFamily.familyNumber) : null;

  if (!familyId) {
    const [member] = await db
      .select({
        familyId: schema.familyMembers.familyId,
        familyNumber: schema.families.familyNumber,
      })
      .from(schema.familyMembers)
      .innerJoin(schema.families, eq(schema.familyMembers.familyId, schema.families.id))
      .where(and(eq(schema.familyMembers.userId, userId), eq(schema.familyMembers.isActive, true)))
      .limit(1);

    if (member) {
      familyId = member.familyId;
      familyNumber = member.familyNumber ? decryptPII(member.familyNumber) : null;
    }
  }

  // 2. Ambil aturan iuran aktif
  const activeRulesRaw = await db
    .select({
      id: schema.feeRules.id,
      name: schema.feeRules.name,
      amount: schema.feeRules.amount,
      isMandatory: schema.feeRules.isMandatory,
    })
    .from(schema.feeRules)
    .where(eq(schema.feeRules.isActive, true))
    .orderBy(desc(schema.feeRules.createdAt));

  const activeRules = activeRulesRaw.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    isMandatory: r.isMandatory,
  }));

  const mandatoryRulesTotal = activeRules
    .filter((r) => r.isMandatory)
    .reduce((sum, r) => sum + r.amount, 0);

  if (!familyId) {
    return {
      hasFamily: false,
      familyId: null,
      familyNumber: null,
      currentPeriod,
      currentMonthStatus: 'unpaid',
      currentMonthBilled: mandatoryRulesTotal,
      currentMonthPaid: 0,
      currentMonthRemaining: mandatoryRulesTotal,
      previousMonthsUnpaidBalance: 0,
      totalUnpaidBalance: mandatoryRulesTotal,
      totalPaidThisYear: 0,
      lastPaymentDate: null,
      lastPaymentAmount: 0,
      lastPaymentStatus: null,
      lastPaymentRuleName: null,
      activeRules,
      history: [],
    };
  }

  // 3. Ambil histori pembayaran keluarga dari database
  const historyRaw = await db
    .select({
      id: schema.feePayments.id,
      feeRuleId: schema.feePayments.feeRuleId,
      feeRuleName: schema.feeRules.name,
      period: schema.feePayments.period,
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
      paymentDate: schema.feePayments.paymentDate,
      paymentMethod: schema.feePayments.paymentMethod,
      status: schema.feePayments.status,
      isMandatory: schema.feePayments.isMandatory,
      recordedByName: schema.users.name,
      createdAt: schema.feePayments.createdAt,
    })
    .from(schema.feePayments)
    .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
    .leftJoin(schema.users, eq(schema.feePayments.recordedBy, schema.users.id))
    .where(eq(schema.feePayments.familyId, familyId))
    .orderBy(desc(schema.feePayments.period), desc(schema.feePayments.createdAt));

  const history = historyRaw.map((h) => ({
    id: h.id,
    feeRuleId: h.feeRuleId,
    feeRuleName: h.feeRuleName,
    period: h.period,
    amountBilled: Number(h.amountBilled),
    amountPaid: Number(h.amountPaid),
    paymentDate: h.paymentDate ? String(h.paymentDate) : null,
    paymentMethod: h.paymentMethod,
    status: h.status,
    isMandatory: h.isMandatory,
    recordedByName: h.recordedByName || null,
    createdAt: h.createdAt ? h.createdAt.toISOString() : new Date().toISOString(),
  }));

  // 4. Hitung tunggakan bulan-bulan sebelumnya
  const previousMonthsPayments = history.filter((p) => p.period < currentPeriod);
  const previousMonthsUnpaidBalance = previousMonthsPayments.reduce(
    (sum, p) => sum + Math.max(0, p.amountBilled - p.amountPaid),
    0
  );

  // 5. Hitung tagihan & sisa pembayaran bulan berjalan (seluruh jenis iuran wajib + sukarela yang tercatat)
  const currentMonthPayments = history.filter((p) => p.period === currentPeriod);
  const currentMonthBilledRaw = currentMonthPayments.reduce((sum, p) => sum + p.amountBilled, 0);
  const currentMonthBilled = currentMonthBilledRaw > 0 ? currentMonthBilledRaw : mandatoryRulesTotal;
  const currentMonthPaid = currentMonthPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const currentMonthRemaining = Math.max(0, currentMonthBilled - currentMonthPaid);

  let currentMonthStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
  if (currentMonthRemaining === 0) {
    currentMonthStatus = 'paid';
  } else if (currentMonthPaid > 0) {
    currentMonthStatus = 'partially_paid';
  }

  const totalUnpaidBalance = previousMonthsUnpaidBalance + currentMonthRemaining;

  const totalPaidThisYear = history
    .filter((p) => p.period.startsWith(currentYearPrefix))
    .reduce((sum, p) => sum + p.amountPaid, 0);

  // Transaksi setoran terakhir yang benar-benar pernah disetorkan/dibayar (amountPaid > 0 dan paymentDate valid)
  const paidHistory = history
    .filter((p) => p.amountPaid > 0 && p.paymentDate)
    .sort((a, b) => {
      const dateA = a.paymentDate || '';
      const dateB = b.paymentDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b.period.localeCompare(a.period);
    });

  const lastPayment = paidHistory[0] || null;
  const lastPaymentDate = lastPayment?.paymentDate || null;
  const lastPaymentAmount = lastPayment?.amountPaid ?? 0;
  const lastPaymentStatus = lastPayment?.status ?? null;
  const lastPaymentRuleName = lastPayment?.feeRuleName ?? null;

  return {
    hasFamily: true,
    familyId,
    familyNumber,
    currentPeriod,
    currentMonthStatus,
    currentMonthBilled,
    currentMonthPaid,
    currentMonthRemaining,
    previousMonthsUnpaidBalance,
    totalUnpaidBalance,
    totalPaidThisYear,
    lastPaymentDate,
    lastPaymentAmount,
    lastPaymentStatus,
    lastPaymentRuleName,
    activeRules,
    history,
  };
}
