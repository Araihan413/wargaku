import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, sql, gte, inArray } from 'drizzle-orm';
import { startOfMonth, subMonths, format } from 'date-fns';

// ==========================================
// INTERNAL DASHBOARD QUERIES (OPTIMIZED)
// ==========================================

/**
 * 1. SUPER ADMIN DASHBOARD STATS
 * Query statistik agregat lengkap untuk Super Admin (10x lebih cepat via Promise.all).
 */
export async function getSuperAdminDashboardStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    [totalUsers],
    [totalMembers],
    [totalTenants],
    [totalFamilies],
    [cashAggregate],
    [pendingFamilies],
    [pendingUsers],
    [activeComplaints],
    [todayLogs],
    roleCounts,
    [sysSetting],
    recentAuditLogs,
  ] = await Promise.all([
    // Total Users
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.users),

    // Total Anggota Keluarga (Warga Tetap)
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)),

    // Total Pendatang / Anak Kos Individu Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.rentalContracts).where(and(eq(schema.rentalContracts.isActive, true), eq(schema.rentalContracts.tenantType, 'individual'))),

    // Total KK Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(eq(schema.families.isActive, true)),

    // Agregasi Tunggal Kas (Income & Expense)
    db.select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),

    // Pending Families
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'pending'))),

    // Pending Users
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.users).where(eq(schema.users.status, 'pending')),

    // Active Complaints
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.complaints).where(sql`${schema.complaints.status} IN ('menunggu', 'proses')`),

    // Today Audit Logs
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.activityLogs).where(gte(schema.activityLogs.createdAt, startOfToday)),

    // Role Distribution
    db.select({
      roleId: schema.userRoles.roleId,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.userRoles).where(eq(schema.userRoles.isPrimary, true)).groupBy(schema.userRoles.roleId),

    // System Settings
    db.select().from(schema.systemSettings).limit(1),

    // Recent Audit Logs
    db.select({
      id: schema.activityLogs.id,
      action: schema.activityLogs.action,
      module: schema.activityLogs.module,
      description: schema.activityLogs.description,
      ipAddress: schema.activityLogs.ipAddress,
      createdAt: schema.activityLogs.createdAt,
      actorName: schema.users.name,
      actorNik: sql<string | null>`NULL`,
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(10),
  ]);

  const roleMap: Record<number, number> = {};
  roleCounts.forEach((r) => {
    roleMap[r.roleId] = r.count;
  });

  const totalInc = cashAggregate?.totalIncome ?? 0;
  const totalExp = cashAggregate?.totalExpense ?? 0;

  return {
    summary: {
      totalUsers: totalUsers?.count ?? 0,
      totalResidents: (totalMembers?.count ?? 0) + (totalTenants?.count ?? 0),
      verifiedFamilies: totalFamilies?.count ?? 0,
      totalCashBalance: totalInc - totalExp,
      pendingVerifications: (pendingFamilies?.count ?? 0) + (pendingUsers?.count ?? 0),
      activeComplaints: activeComplaints?.count ?? 0,
      todayAuditLogsCount: todayLogs?.count ?? 0,
    },
    roleDistribution: {
      superAdminCount: roleMap[1] ?? 0,
      ketuaRtCount: roleMap[2] ?? 0,
      sekretarisCount: roleMap[3] ?? 0,
      bendaharaCount: roleMap[4] ?? 0,
      koordinatorKosCount: roleMap[5] ?? 0,
      wargaCount: roleMap[6] ?? 0,
    },
    systemSettingInfo: sysSetting
      ? {
          ...sysSetting,
          updatedAt: sysSetting.updatedAt ? sysSetting.updatedAt.toISOString() : new Date().toISOString(),
        }
      : null,
    recentAuditLogs: recentAuditLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
    })),
  };
}

/**
 * 2. KETUA RT DASHBOARD STATS
 * Data statistik agregat lengkap demografi, kas, hunian, & pengaduan untuk Ketua RT.
 */
export async function getRtDashboardStats() {
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const [
    [totalFamilies],
    [totalMembers],
    [totalTenants],
    [totalDwellings],
    genderCounts,
    [ageStatsRes],
    occupationCounts,
    educationCounts,
    religionCounts,
    [dwellingTypesRes],
    [cashAggregate],
    [duesAmountAggregate],
    [mandatoryRulesCount],
    fullyPaidFamiliesRows,
    complaintCounts,
    topCategories,
    allFamilyCheckIns,
    individualRentalCheckIns,
    allFamilyCheckOuts,
    individualRentalCheckOuts,
    monthlyIncome,
    monthlyExpense,
    [totalRoomsAgg],
    [filledRoomsAgg],
    ktpMemberStats,
    ktpTenantStats,
    sysSettingRes,
  ] = await Promise.all([
    // Total KK Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(eq(schema.families.isActive, true)),

    // Total Warga Tetap
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)),

    // Total Pendatang / Anak Kos Individu Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.rentalContracts).where(and(eq(schema.rentalContracts.isActive, true), eq(schema.rentalContracts.tenantType, 'individual'))),

    // Total Rumah / Dwellings Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.dwellings).where(eq(schema.dwellings.isActive, true)),

    // Gender Distribution
    db.select({
      gender: schema.familyMembers.gender,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(schema.familyMembers.gender),

    // Age Distribution Stats
    db.select({
      anak: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) < 12 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      remaja: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 12 AND 17 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      dewasa: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 18 AND 59 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      lansia: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) >= 60 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      belumTerdata: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    // Occupation Distribution
    db.select({
      occupation: sql<string>`COALESCE(NULLIF(${schema.familyMembers.occupation}, ''), 'Belum Terdata')`.as('occupation'),
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(sql`COALESCE(NULLIF(${schema.familyMembers.occupation}, ''), 'Belum Terdata')`).orderBy(desc(sql`count(*)`)),

    // Education Distribution
    db.select({
      education: sql<string>`COALESCE(NULLIF(${schema.familyMembers.educationLevel}, ''), 'Belum Terdata')`.as('education'),
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(sql`COALESCE(NULLIF(${schema.familyMembers.educationLevel}, ''), 'Belum Terdata')`),

    // Religion Distribution
    db.select({
      religion: sql<string>`COALESCE(NULLIF(${schema.familyMembers.religion}, ''), 'Belum Terdata')`.as('religion'),
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(sql`COALESCE(NULLIF(${schema.familyMembers.religion}, ''), 'Belum Terdata')`),

    // Status Hunian (Terisi Tetap vs Kos/Homestay vs Kosong)
    db.select({
      terisi: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dwellings.type} = 'permanen' AND f.id IS NOT NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      kos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dwellings.type} IN ('kos', 'homestay') THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      kosong: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dwellings.type} = 'permanen' AND f.id IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.dwellings)
      .leftJoin(
        sql`(SELECT DISTINCT dwelling_id as id FROM families WHERE is_active = 1 AND dwelling_id IS NOT NULL) f`,
        sql`${schema.dwellings.id} = f.id`
      )
      .where(eq(schema.dwellings.isActive, true)),

    // Cash Aggregate (Total Balance)
    db.select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),

    // Dues Amount Aggregate for Current Period
    db.select({
      billed: sql<number>`COALESCE(SUM(${schema.feePayments.amountBilled}), 0)`.mapWith(Number),
      paid: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number),
    }).from(schema.feePayments).where(eq(schema.feePayments.period, currentPeriod)),

    // Mandatory Fee Rules Count
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.feeRules)
      .where(and(eq(schema.feeRules.isActive, true), eq(schema.feeRules.isMandatory, true))),

    // Fully Paid Families for Current Period
    db.select({
      familyId: schema.feePayments.familyId,
      paidCount: sql<number>`COUNT(DISTINCT ${schema.feePayments.feeRuleId})`.mapWith(Number),
    })
    .from(schema.feePayments)
    .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .where(
      and(
        eq(schema.feePayments.period, currentPeriod),
        eq(schema.feePayments.status, 'paid'),
        eq(schema.feeRules.isMandatory, true),
        eq(schema.feeRules.isActive, true),
        eq(schema.families.isActive, true)
      )
    )
    .groupBy(schema.feePayments.familyId),

    // Complaint Status Summary
    db.select({
      status: schema.complaints.status,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.complaints).groupBy(schema.complaints.status),

    // Top Complaint Categories
    db.select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.complaints).groupBy(schema.complaints.category).orderBy(desc(sql`count(*)`)),

    // 1. All Family Members Check-ins (Mencakup Seluruh Warga Berkeluarga, Baik Tetap Maupun Kos)
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.familyMembers.createdAt}, '%Y-%m')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.familyMembers)
    .where(and(
      eq(schema.familyMembers.isActive, true),
      gte(schema.familyMembers.createdAt, sixMonthsAgo)
    ))
    .groupBy(sql`DATE_FORMAT(${schema.familyMembers.createdAt}, '%Y-%m')`),

    // 2. Individual Renters Check-ins (Penyewa Perorangan Kos/Kontrakan - 1 Jiwa per Kontrak)
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.rentalContracts.createdAt}, '%Y-%m')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.rentalContracts)
    .where(and(
      eq(schema.rentalContracts.tenantType, 'individual'),
      gte(schema.rentalContracts.createdAt, sixMonthsAgo)
    ))
    .groupBy(sql`DATE_FORMAT(${schema.rentalContracts.createdAt}, '%Y-%m')`),

    // 3. All Family Members Check-outs (Warga Berkeluarga Nonaktif)
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.familyMembers.updatedAt}, '%Y-%m')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.familyMembers)
    .where(and(
      eq(schema.familyMembers.isActive, false),
      gte(schema.familyMembers.updatedAt, sixMonthsAgo)
    ))
    .groupBy(sql`DATE_FORMAT(${schema.familyMembers.updatedAt}, '%Y-%m')`),

    // 4. Individual Renters Check-outs (Penyewa Perorangan Nonaktif)
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.rentalContracts.updatedAt}, '%Y-%m')`,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.rentalContracts)
    .where(and(
      eq(schema.rentalContracts.tenantType, 'individual'),
      eq(schema.rentalContracts.isActive, false),
      gte(schema.rentalContracts.updatedAt, sixMonthsAgo)
    ))
    .groupBy(sql`DATE_FORMAT(${schema.rentalContracts.updatedAt}, '%Y-%m')`),

    // Monthly Cash Income 6 Bulan Terakhir
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.cashTransactions.createdAt}, '%Y-%m')`,
      amount: sql<number>`SUM(${schema.cashTransactions.amount})`.mapWith(Number),
    })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, 'income'), gte(schema.cashTransactions.createdAt, sixMonthsAgo)))
    .groupBy(sql`DATE_FORMAT(${schema.cashTransactions.createdAt}, '%Y-%m')`),

    // Monthly Cash Expense 6 Bulan Terakhir
    db.select({
      monthYear: sql<string>`DATE_FORMAT(${schema.cashTransactions.createdAt}, '%Y-%m')`,
      amount: sql<number>`SUM(${schema.cashTransactions.amount})`.mapWith(Number),
    })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, 'expense'), gte(schema.cashTransactions.createdAt, sixMonthsAgo)))
    .groupBy(sql`DATE_FORMAT(${schema.cashTransactions.createdAt}, '%Y-%m')`),

    // Total Rooms in Rental Properties
    // Total Rooms in Rental Properties
    db.select({
      total: sql<number>`COALESCE(SUM(${schema.rentalProperties.totalRooms}), 0)`.mapWith(Number),
    })
    .from(schema.rentalProperties)
    .where(eq(schema.rentalProperties.isActive, true)),

    // Active Rental Contracts (Filled Rooms)
    db.select({
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.rentalContracts)
    .where(eq(schema.rentalContracts.isActive, true)),

    // KTP Distribution - Family Members (dengan breakdown Warga Tetap vs Keluarga Pengontrak)
    db.select({
      local: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = TRUE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalPermanent: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = FALSE AND rc.id IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalFamilyRental: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = FALSE AND rc.id IS NOT NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      totalLocalPermanent: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = TRUE AND rc.id IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      totalLocalFamilyRental: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = TRUE AND rc.id IS NOT NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
    .from(schema.familyMembers)
    .leftJoin(
      sql`(SELECT DISTINCT family_id as id FROM rental_contracts WHERE is_active = 1 AND tenant_type = 'family' AND family_id IS NOT NULL) rc`,
      sql`${schema.familyMembers.familyId} = rc.id`
    )
    .where(eq(schema.familyMembers.isActive, true)),

    // KTP Distribution - Penghuni Sewa / Anak Kos Individu (Rental Contracts)
    db.select({
      local: sql<number>`COALESCE(SUM(CASE WHEN ${schema.rentalContracts.isKtpSameVillage} = TRUE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalIndividualKos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.rentalContracts.isKtpSameVillage} = FALSE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
    .from(schema.rentalContracts)
    .where(and(
      eq(schema.rentalContracts.isActive, true),
      eq(schema.rentalContracts.tenantType, 'individual')
    )),

    // System Settings (untuk Nama Kelurahan)
    db.select({
      villageName: schema.systemSettings.villageName,
      rtName: schema.systemSettings.rtName,
      rwName: schema.systemSettings.rwName,
    })
    .from(schema.systemSettings)
    .limit(1),
  ]);

  const [ktpMemberRes] = ktpMemberStats || [null];
  const [ktpTenantRes] = ktpTenantStats || [null];
  const [sysSetting] = sysSettingRes || [null];

  const localMembers = ktpMemberRes?.local ?? 0;
  const localTenants = ktpTenantRes?.local ?? 0;
  const nonLocalIndividualKos = ktpTenantRes?.nonLocalIndividualKos ?? 0;
  const nonLocalFamilyRental = ktpMemberRes?.nonLocalFamilyRental ?? 0;
  const nonLocalPermanent = ktpMemberRes?.nonLocalPermanent ?? 0;

  const totalLocalKtp = localMembers + localTenants;
  const totalNonLocalKtp = nonLocalIndividualKos + nonLocalFamilyRental + nonLocalPermanent;
  const totalKtpAnalyzed = totalLocalKtp + totalNonLocalKtp;

  const localPercentage = totalKtpAnalyzed > 0 ? Math.round((totalLocalKtp / totalKtpAnalyzed) * 100) : 0;
  const nonLocalPercentage = totalKtpAnalyzed > 0 ? (100 - localPercentage) : 0;

  const checkInMap: Record<string, number> = {};
  const checkOutMap: Record<string, number> = {};
  const incomeMap: Record<string, number> = {};
  const expenseMap: Record<string, number> = {};

  (allFamilyCheckIns || []).forEach((f) => {
    if (f.monthYear) checkInMap[f.monthYear] = (checkInMap[f.monthYear] || 0) + f.count;
  });
  (individualRentalCheckIns || []).forEach((r) => {
    if (r.monthYear) checkInMap[r.monthYear] = (checkInMap[r.monthYear] || 0) + r.count;
  });

  (allFamilyCheckOuts || []).forEach((f) => {
    if (f.monthYear) checkOutMap[f.monthYear] = (checkOutMap[f.monthYear] || 0) + f.count;
  });
  (individualRentalCheckOuts || []).forEach((r) => {
    if (r.monthYear) checkOutMap[r.monthYear] = (checkOutMap[r.monthYear] || 0) + r.count;
  });

  (monthlyIncome || []).forEach((inc) => {
    if (inc.monthYear) incomeMap[inc.monthYear] = (incomeMap[inc.monthYear] || 0) + inc.amount;
  });

  (monthlyExpense || []).forEach((exp) => {
    if (exp.monthYear) expenseMap[exp.monthYear] = (expenseMap[exp.monthYear] || 0) + exp.amount;
  });

  const totalWargaTetap = totalMembers?.count ?? 0;
  const totalPendatang = totalTenants?.count ?? 0;
  const totalWargaAktif = totalWargaTetap + totalPendatang;

  // Real Cashflow Trend 6 Bulan Terakhir
  const cashflowTrend: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const key = format(monthDate, 'yyyy-MM');
    const label = format(monthDate, 'MMM yyyy');
    cashflowTrend.push({
      month: label,
      income: incomeMap[key] || 0,
      expense: expenseMap[key] || 0,
    });
  }

  // Population Mutations 6 Bulan Terakhir
  const populationMutations: { month: string; checkIn: number; checkOut: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const key = format(monthDate, 'yyyy-MM');
    const label = format(monthDate, 'MMM yyyy');
    populationMutations.push({
      month: label,
      checkIn: checkInMap[key] || 0,
      checkOut: checkOutMap[key] || 0,
    });
  }

  const totalKK = totalFamilies?.count ?? 0;
  const mandatoryCount = mandatoryRulesCount?.count ?? 0;
  const fullyPaidCount = mandatoryCount > 0
    ? fullyPaidFamiliesRows.filter((r) => r.paidCount >= mandatoryCount).length
    : 0;
  const rawParticipation = totalKK > 0 ? Math.round((fullyPaidCount / totalKK) * 100) : 0;
  const participationRate = Number.isNaN(rawParticipation) ? 0 : rawParticipation;

  const totalRooms = totalRoomsAgg?.total ?? 0;
  const filledRooms = filledRoomsAgg?.total ?? 0;
  const rawOccupancy = totalRooms > 0 ? Math.min(100, Math.round((filledRooms / totalRooms) * 100)) : 0;
  const occupancyPercent = Number.isNaN(rawOccupancy) ? 0 : rawOccupancy;

  return {
    summary: {
      totalRumah: totalDwellings?.count ?? 0,
      totalWargaAktif,
      totalKK: totalFamilies?.count ?? 0,
      totalWargaTetap,
      totalPendatang,
    },
    ktpDistribution: {
      villageName: sysSetting?.villageName || 'Kelurahan Setempat',
      totalLocal: totalLocalKtp,
      totalNonLocal: totalNonLocalKtp,
      localPercentage,
      nonLocalPercentage,
      total: totalKtpAnalyzed,
      nonLocalBreakdown: {
        individualKos: nonLocalIndividualKos,
        familyRenters: nonLocalFamilyRental,
        permanentResidents: nonLocalPermanent,
      },
      breakdown: {
        wargaTetap: {
          local: ktpMemberRes?.totalLocalPermanent ?? 0,
          nonLocal: nonLocalPermanent,
        },
        penghuniSewa: {
          local: (ktpMemberRes?.totalLocalFamilyRental ?? 0) + localTenants,
          nonLocal: nonLocalIndividualKos + nonLocalFamilyRental,
        },
      },
    },
    genderDistribution: (() => {
      const maleObj = (genderCounts || []).find((g) => g.gender === "L");
      const femaleObj = (genderCounts || []).find((g) => g.gender === "P");
      return [
        { gender: "Laki-laki", count: maleObj ? maleObj.count : 0 },
        { gender: "Perempuan", count: femaleObj ? femaleObj.count : 0 },
      ];
    })(),
    ageDistribution: totalWargaTetap === 0
      ? []
      : [
          { range: 'Anak (0-11 thn)', count: ageStatsRes?.anak ?? 0 },
          { range: 'Remaja (12-17 thn)', count: ageStatsRes?.remaja ?? 0 },
          { range: 'Dewasa (18-59 thn)', count: ageStatsRes?.dewasa ?? 0 },
          { range: 'Lansia (60+ thn)', count: ageStatsRes?.lansia ?? 0 },
          ...((ageStatsRes?.belumTerdata ?? 0) > 0 ? [{ range: 'Belum Terdata', count: ageStatsRes?.belumTerdata ?? 0 }] : []),
        ],
    occupationDistribution: occupationCounts.map((o) => ({ occupation: o.occupation || 'Belum Terdata', count: o.count })),
    educationDistribution: educationCounts.map((e) => ({ education: e.education || 'Belum Terdata', count: e.count })),
    religionDistribution: religionCounts.map((r) => ({ religion: r.religion || 'Belum Terdata', count: r.count })),
    dwellingDistribution: [
      { type: 'Terisi (Tetap)', count: dwellingTypesRes?.terisi ?? 0 },
      { type: 'Kos & Homestay', count: dwellingTypesRes?.kos ?? 0 },
      { type: 'Hunian Kosong', count: dwellingTypesRes?.kosong ?? 0 },
    ],
    occupancyRate: {
      totalRooms,
      filledRooms,
      occupancyPercent,
    },
    cashSummary: {
      currentBalance: (cashAggregate?.totalIncome ?? 0) - (cashAggregate?.totalExpense ?? 0),
      billedIuran: duesAmountAggregate?.billed ?? 0,
      paidIuran: duesAmountAggregate?.paid ?? 0,
      participationRate,
    },
    cashflowTrend,
    complaintSummary: (() => {
      const STATUSES = ['menunggu', 'proses', 'selesai', 'ditolak'] as const;
      const statusMap = new Map<string, number>(complaintCounts.map((c) => [c.status, c.count]));
      const statusLabelMap: Record<string, string> = {
        menunggu: 'Menunggu',
        proses: 'Proses',
        selesai: 'Selesai',
        ditolak: 'Ditolak',
      };
      return STATUSES.map((st) => ({
        status: statusLabelMap[st] || st,
        count: statusMap.get(st) ?? 0,
      }));
    })(),
    topComplaintCategories: (() => {
      const ALL_CATEGORIES = ['Infrastruktur', 'Kebersihan', 'Keamanan', 'Sosial', 'Lainnya'] as const;
      const catMap = new Map<string, number>(topCategories.map((c) => [c.category, c.count]));
      return ALL_CATEGORIES.map((cat) => ({
        category: cat,
        count: catMap.get(cat) ?? 0,
      }));
    })(),
    populationMutations,
  };
}

/**
 * 3. SEKRETARIS DASHBOARD STATS
 * Data statistik antrean pendaftaran pending, agenda, pengumuman, & pengaduan untuk Sekretaris.
 */
export async function getSecretaryDashboardStats() {
  const [
    pendingUsers,
    upcomingActivities,
    latestAnnouncements,
    recentComplaints,
    [newComplaintsCount],
  ] = await Promise.all([
    // Pending Users Registration Queue
    db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.status, 'pending'))
    .orderBy(desc(schema.users.createdAt))
    .limit(10),

    // Upcoming Activities
    db.select({
      id: schema.activities.id,
      title: schema.activities.title,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
    })
    .from(schema.activities)
    .where(gte(schema.activities.eventDate, new Date()))
    .orderBy(schema.activities.eventDate)
    .limit(5),

    // Latest Announcements
    db.select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      publishedAt: schema.announcements.publishedAt,
    })
    .from(schema.announcements)
    .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt))
    .limit(5),

    // Recent Complaints
    db.select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      category: schema.complaints.category,
      description: schema.complaints.description,
      status: schema.complaints.status,
      createdAt: schema.complaints.createdAt,
    })
    .from(schema.complaints)
    .orderBy(desc(schema.complaints.createdAt))
    .limit(5),

    // New Complaints Count
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, 'menunggu')),
  ]);

  return {
    summary: {
      pendingRegistrations: pendingUsers.length,
      newComplaints: newComplaintsCount?.count ?? 0,
      upcomingActivities: upcomingActivities.length,
    },
    pendingRegistrations: pendingUsers.map((u) => ({
      ...u,
      nik: null,
      address: null,
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
    })),
    upcomingActivities: upcomingActivities.map((a) => ({
      ...a,
      eventDate: a.eventDate ? a.eventDate.toISOString() : new Date().toISOString(),
    })),
    latestAnnouncements: latestAnnouncements.map((a) => ({
      ...a,
      publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    })),
    recentComplaints: recentComplaints.map((c) => ({
      ...c,
      reporterName: c.reporterName || 'Warga (Anonim)',
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    })),
  };
}

/**
 * 4. BENDAHARA DASHBOARD STATS
 * Saldo kas, iuran warga, & 5 transaksi terbaru untuk Bendahara.
 */
export async function getTreasurerDashboardStats() {
  const currentPeriod = format(new Date(), 'yyyy-MM');

  const [
    [cashAggregate],
    [thisMonthCash],
    [totalFamiliesCount],
    [mandatoryRulesCount],
    fullyPaidFamiliesRows,
    recentTransactions,
  ] = await Promise.all([
    // Saldo Total
    db.select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),

    // Pemasukan & Pengeluaran Bulan Ini
    db.select({
      income: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' AND ${schema.cashTransactions.transactionDate} >= ${startOfMonth(new Date())} THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' AND ${schema.cashTransactions.transactionDate} >= ${startOfMonth(new Date())} THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),

    // Total KK Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(eq(schema.families.isActive, true)),

    // Jumlah Aturan Iuran Wajib Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.feeRules)
      .where(and(eq(schema.feeRules.isActive, true), eq(schema.feeRules.isMandatory, true))),

    // KK yang Membayar Seluruh Iuran Wajib Bulan Ini
    db.select({
      familyId: schema.feePayments.familyId,
      paidCount: sql<number>`COUNT(DISTINCT ${schema.feePayments.feeRuleId})`.mapWith(Number),
    })
    .from(schema.feePayments)
    .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .where(
      and(
        eq(schema.feePayments.period, currentPeriod),
        eq(schema.feePayments.status, 'paid'),
        eq(schema.feeRules.isMandatory, true),
        eq(schema.feeRules.isActive, true),
        eq(schema.families.isActive, true)
      )
    )
    .groupBy(schema.feePayments.familyId),

    // 5 Transaksi Terbaru
    db.select({
      id: schema.cashTransactions.id,
      description: schema.cashTransactions.description,
      category: schema.cashTransactions.category,
      amount: schema.cashTransactions.amount,
      type: schema.cashTransactions.type,
      transactionDate: schema.cashTransactions.transactionDate,
      receiptFile: schema.cashTransactions.receiptFile,
    })
    .from(schema.cashTransactions)
    .orderBy(desc(schema.cashTransactions.transactionDate))
    .limit(5),
  ]);

  const totalInc = cashAggregate?.totalIncome ?? 0;
  const totalExp = cashAggregate?.totalExpense ?? 0;
  const totalBalance = totalInc - totalExp;

  const totalFamilies = totalFamiliesCount?.count ?? 0;
  const mandatoryCount = mandatoryRulesCount?.count ?? 0;
  const paidFamilies = mandatoryCount > 0
    ? fullyPaidFamiliesRows.filter((r) => r.paidCount >= mandatoryCount).length
    : 0;
  const unpaidFamilies = Math.max(0, totalFamilies - paidFamilies);
  const duesPaidPct = totalFamilies > 0 ? Math.round((paidFamilies / totalFamilies) * 100) : 0;

  return {
    totalBalance,
    thisMonthIncome: thisMonthCash?.income ?? 0,
    thisMonthExpense: thisMonthCash?.expense ?? 0,
    duesStats: {
      totalActiveFamilies: totalFamilies,
      paidFamiliesCount: paidFamilies,
      unpaidFamiliesCount: unpaidFamilies,
      duesPaidPercentage: duesPaidPct,
      currentPeriod,
    },
    recentTransactions: recentTransactions.map((t) => ({
      id: String(t.id),
      title: t.description || t.category,
      category: t.category,
      amount: Number(t.amount),
      type: t.type,
      date: t.transactionDate ? t.transactionDate.toISOString() : new Date().toISOString(),
      receiptFile: t.receiptFile || null,
      status: 'terverifikasi',
    })),
  };
}

/**
 * 4. SEKRETARIS DASHBOARD STATS
 * Query pengajuan surat pengantar, arsip surat, & pengumuman.
 */
export async function getSekretarisDashboardStats() {
  const [[totalAnnouncements]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.announcements),
  ]);

  return {
    pendingLetters: 0,
    approvedLettersThisMonth: 0,
    totalAnnouncements: Number(totalAnnouncements?.count || 0),
    recentLetterRequests: [],
  };
}

/**
 * 5. KOORDINATOR KOS DASHBOARD STATS
 * Properti kos & penyewa aktif untuk Koordinator Kos (berdasarkan userId & roleId).
 */
export async function getCoordinatorDashboardStats(userId: string, userRoleId?: number) {
  const isGlobalAdmin = userRoleId === 1 || userRoleId === 2 || userRoleId === 3;

  const propertiesWhere = isGlobalAdmin
    ? eq(schema.rentalProperties.isActive, true)
    : and(
        eq(schema.rentalProperties.coordinatorUserId, userId),
        eq(schema.rentalProperties.isActive, true)
      );

  const properties = await db
    .select({
      id: schema.rentalProperties.id,
      name: schema.rentalProperties.name,
      totalRooms: schema.rentalProperties.totalRooms,
      occupiedRooms: schema.rentalProperties.occupiedRooms,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      type: schema.dwellings.type,
    })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(propertiesWhere);

  if (properties.length === 0) {
    return {
      summary: {
        totalProperties: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        vacantRooms: 0,
        occupancyRate: 0,
        pendingVerifications: 0,
        totalActiveResidents: 0,
      },
      propertyBreakdown: [],
      pendingQueue: [],
    };
  }

  const propertyIds = properties.map((p) => p.id);

  const activeContracts = await db
    .select({
      id: schema.rentalContracts.id,
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
      tenantType: schema.rentalContracts.tenantType,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      checkInDate: schema.rentalContracts.checkInDate,
      verificationStatus: schema.rentalContracts.verificationStatus,
      userStatus: schema.users.status,
      userName: schema.users.name,
      propertyName: schema.rentalProperties.name,
    })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .where(
      and(
        inArray(schema.rentalContracts.rentalPropertyId, propertyIds),
        eq(schema.rentalContracts.isActive, true)
      )
    );

  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0);
  const occupiedRooms = properties.reduce((sum, p) => sum + (p.occupiedRooms || 0), 0);
  const vacantRooms = Math.max(0, totalRooms - occupiedRooms);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalActiveResidents = activeContracts.length;

  const pendingContracts = activeContracts.filter((c) => c.verificationStatus === 'pending');
  const pendingVerifications = pendingContracts.length;

  const propertyBreakdown = properties.map((p) => {
    const propTotalRooms = p.totalRooms || 0;
    const propOccupiedRooms = p.occupiedRooms || 0;
    const propVacantRooms = Math.max(0, propTotalRooms - propOccupiedRooms);
    const propOccupancyRate = propTotalRooms > 0 ? Math.round((propOccupiedRooms / propTotalRooms) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      address: `Blok ${p.blockNumber} No. ${p.houseNumber}`,
      type: p.type || 'kos',
      totalRooms: propTotalRooms,
      occupiedRooms: propOccupiedRooms,
      vacantRooms: propVacantRooms,
      occupancyRate: propOccupancyRate,
    };
  });

  const pendingQueue = pendingContracts.map((c) => ({
    id: c.id,
    name: c.individualName || c.userName || 'Penyewa',
    nik: c.individualNik || '-',
    tenantType: c.tenantType === 'family' ? ('keluarga' as const) : ('perorangan' as const),
    checkInDate: c.checkInDate ? (typeof c.checkInDate === 'string' ? c.checkInDate : (c.checkInDate as Date).toISOString()) : new Date().toISOString(),
    verificationStatus: 'pending' as const,
    ktpFile: c.individualKtpFile || null,
    propertyName: c.propertyName,
  }));

  return {
    summary: {
      totalProperties,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      pendingVerifications,
      totalActiveResidents,
    },
    propertyBreakdown,
    pendingQueue,
  };
}

/**
 * 6. WARGA DASHBOARD STATS
 * Data dashboard untuk warga biasa (berdasarkan userId).
 */
export async function getWargaDashboard(userId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) return null;

  // Cari KK milik user (sebagai kepala keluarga)
  const [myFamily] = await db
    .select({
      id: schema.families.id,
      familyNumber: schema.families.familyNumber,
      verificationStatus: schema.families.verificationStatus,
      verificationNote: schema.families.verificationNote,
      dwellingId: schema.families.dwellingId,
      kkFile: schema.families.kkFile,
    })
    .from(schema.families)
    .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
    .limit(1);

  let familyData = myFamily ?? null;
  if (!familyData) {
    const [memberRow] = await db
      .select({ familyId: schema.familyMembers.familyId })
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.userId, userId), eq(schema.familyMembers.isActive, true)))
      .limit(1);

    if (memberRow?.familyId) {
      const [foundFamily] = await db
        .select({
          id: schema.families.id,
          familyNumber: schema.families.familyNumber,
          verificationStatus: schema.families.verificationStatus,
          verificationNote: schema.families.verificationNote,
          dwellingId: schema.families.dwellingId,
          kkFile: schema.families.kkFile,
        })
        .from(schema.families)
        .where(eq(schema.families.id, memberRow.familyId))
        .limit(1);
      familyData = foundFamily ?? null;
    }
  }

  let dwellingData = null;
  let memberCount = 0;
  let headName = user.name;

  if (familyData) {
    const [[dwelling], [countRes], [headMember]] = await Promise.all([
      db
        .select({
          id: schema.dwellings.id,
          blockNumber: schema.dwellings.blockNumber,
          houseNumber: schema.dwellings.houseNumber,
          type: schema.dwellings.type,
          latitude: schema.dwellings.latitude,
          longitude: schema.dwellings.longitude,
          qrToken: schema.dwellings.qrToken,
        })
        .from(schema.dwellings)
        .where(eq(schema.dwellings.id, familyData.dwellingId!))
        .limit(1),

      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.familyMembers)
        .where(and(eq(schema.familyMembers.familyId, familyData.id), eq(schema.familyMembers.isActive, true))),

      db
        .select({ name: schema.familyMembers.name })
        .from(schema.familyMembers)
        .where(and(eq(schema.familyMembers.familyId, familyData.id), eq(schema.familyMembers.relationship, 'Kepala_Keluarga')))
        .limit(1),
    ]);

    dwellingData = dwelling ?? null;
    memberCount = countRes?.count ?? 0;
    if (headMember?.name) {
      headName = headMember.name;
    }
  }

  const [
    pendingPayments,
    recentAnnouncements,
    [unreadNotifCount],
    [totalFamilyMembersRes],
    [totalIndividualRentersRes],
    [totalFamiliesRes],
    [cashAggr],
    recentActivities,
    officerList,
  ] = await Promise.all([
    familyData
      ? db
          .select({
            id: schema.feePayments.id,
            period: schema.feePayments.period,
            amountBilled: schema.feePayments.amountBilled,
            amountPaid: schema.feePayments.amountPaid,
            status: schema.feePayments.status,
            ruleName: schema.feeRules.name,
          })
          .from(schema.feePayments)
          .innerJoin(schema.feeRules, eq(schema.feePayments.feeRuleId, schema.feeRules.id))
          .where(
            and(
              eq(schema.feePayments.familyId, familyData.id),
              sql`${schema.feePayments.status} IN ('unpaid', 'partially_paid')`
            )
          )
          .orderBy(desc(schema.feePayments.period))
          .limit(5)
      : Promise.resolve([]),

    db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        content: schema.announcements.content,
        category: schema.announcements.category,
        isPinned: schema.announcements.isPinned,
        publishedAt: schema.announcements.publishedAt,
        createdAt: schema.announcements.createdAt,
      })
      .from(schema.announcements)
      .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt))
      .limit(5),

    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false))),

    // Total Warga Tetap (KK)
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    // Total Anak Kos / Penyewa Individu Aktif
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.rentalContracts)
      .where(and(eq(schema.rentalContracts.isActive, true), eq(schema.rentalContracts.tenantType, 'individual'))),

    // Total Kartu Keluarga Aktif
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.families)
      .where(eq(schema.families.isActive, true)),

    // Agregat Kas RT
    db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
        totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      })
      .from(schema.cashTransactions),

    // Kegiatan Terbaru
    db
      .select({
        id: schema.activities.id,
        title: schema.activities.title,
        eventDate: schema.activities.eventDate,
        location: schema.activities.location,
        description: schema.activities.description,
        createdAt: schema.activities.createdAt,
      })
      .from(schema.activities)
      .orderBy(desc(schema.activities.eventDate))
      .limit(5),

    // Kontak Pengurus RT
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        roleId: schema.userRoles.roleId,
      })
      .from(schema.userRoles)
      .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
      .where(sql`${schema.userRoles.roleId} IN (1, 2, 3, 4) AND ${schema.users.status} != 'suspended'`),
  ]);

  const totalIncome = cashAggr?.totalIncome ?? 0;
  const totalExpense = cashAggr?.totalExpense ?? 0;
  const balance = totalIncome - totalExpense;

  const roleNameMap: Record<number, string> = {
    1: "Super Admin",
    2: "Ketua RT",
    3: "Sekretaris",
    4: "Bendahara",
  };

  return {
    user,
    family: familyData
      ? {
          ...familyData,
          headName,
          hasVerified: familyData.verificationStatus === 'verified',
          totalMembers: memberCount,
        }
      : null,
    dwelling: dwellingData,
    pendingPayments: pendingPayments.map((p) => ({
      id: p.id,
      ruleName: p.ruleName,
      period: p.period,
      amountDue: Number(p.amountBilled) - Number(p.amountPaid),
    })),
    announcements: recentAnnouncements.map((a) => {
      const pubDate = a.publishedAt || a.createdAt || new Date();
      const createDate = a.createdAt || a.publishedAt || new Date();
      return {
        id: a.id,
        title: a.title,
        category: a.category,
        content: a.content || "",
        isPinned: Boolean(a.isPinned),
        publishedAt: pubDate instanceof Date ? pubDate.toISOString() : String(pubDate),
        createdAt: createDate instanceof Date ? createDate.toISOString() : String(createDate),
      };
    }),
    activities: recentActivities.map((act) => {
      const evDate = act.eventDate || act.createdAt || new Date();
      return {
        id: act.id,
        title: act.title,
        eventDate: evDate instanceof Date ? evDate.toISOString() : String(evDate),
        location: act.location || "Wilayah RT",
        description: act.description || "",
      };
    }),
    finance: {
      totalIncome,
      totalExpense,
      balance,
    },
    stats: {
      totalWarga: (totalFamilyMembersRes?.count ?? 0) + (totalIndividualRentersRes?.count ?? 0),
      totalKK: totalFamiliesRes?.count ?? 0,
    },
    officerContacts: officerList.map((o) => ({
      id: o.id,
      name: o.name,
      role: roleNameMap[o.roleId] || "Pengurus RT",
      phone: o.phone || "-",
    })),
    unreadNotifications: unreadNotifCount?.count ?? 0,
  };
}
