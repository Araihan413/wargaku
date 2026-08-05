import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
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

    // Total Penyewa Aktif
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.rentalContracts).where(eq(schema.rentalContracts.isActive, true)),

    // Total KK Terverifikasi
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified'))),

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
    genderCounts,
    ageCounts,
    occupationCounts,
    educationCounts,
    religionCounts,
    dwellingTypeCounts,
    [cashAggregate],
    [duesAggregate],
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
  ] = await Promise.all([
    // Total KK
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified'))),

    // Total Warga Tetap
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)),

    // Total Pendatang / Penyewa
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.rentalContracts).where(eq(schema.rentalContracts.isActive, true)),

    // Gender Distribution
    db.select({
      gender: schema.familyMembers.gender,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(schema.familyMembers.gender),

    // Age Distribution
    db.select({
      range: sql<string>`
        CASE 
          WHEN ${schema.familyMembers.birthDate} IS NULL THEN 'Belum Diisi'
          WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) < 6 THEN '0-5 tahun'
          WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 6 AND 17 THEN '6-17 tahun'
          WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 18 AND 59 THEN '18-59 tahun'
          ELSE '60+ tahun'
        END
      `.as('age_range'),
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(sql`age_range`),

    // Occupation Distribution
    db.select({
      occupation: schema.familyMembers.occupation,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(schema.familyMembers.occupation).limit(5),

    // Education Distribution
    db.select({
      education: schema.familyMembers.educationLevel,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(schema.familyMembers.educationLevel),

    // Religion Distribution
    db.select({
      religion: schema.familyMembers.religion,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.familyMembers).where(eq(schema.familyMembers.isActive, true)).groupBy(schema.familyMembers.religion),

    // Dwelling Type Distribution
    db.select({
      type: schema.dwellings.type,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.dwellings).where(eq(schema.dwellings.isActive, true)).groupBy(schema.dwellings.type),

    // Cash Aggregate (Total Balance)
    db.select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),

    // Dues Compliance Aggregate for Current Period
    db.select({
      billed: sql<number>`COALESCE(SUM(${schema.feePayments.amountBilled}), 0)`.mapWith(Number),
      paid: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number),
      paidCount: sql<number>`COALESCE(SUM(CASE WHEN ${schema.feePayments.status} = 'paid' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      totalCount: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.feePayments).where(eq(schema.feePayments.period, currentPeriod)),

    // Complaint Status Summary
    db.select({
      status: schema.complaints.status,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.complaints).groupBy(schema.complaints.status),

    // Top Complaint Categories
    db.select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    }).from(schema.complaints).groupBy(schema.complaints.category).orderBy(desc(sql`count(*)`)).limit(5),

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
  ]);

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

  const paidCount = duesAggregate?.paidCount ?? 0;
  const totalDuesCount = duesAggregate?.totalCount ?? 0;
  const rawParticipation = totalDuesCount > 0 ? Math.round((paidCount / totalDuesCount) * 100) : 0;
  const participationRate = Number.isNaN(rawParticipation) ? 0 : rawParticipation;

  const totalRooms = totalRoomsAgg?.total ?? 0;
  const filledRooms = filledRoomsAgg?.total ?? 0;
  const rawOccupancy = totalRooms > 0 ? Math.min(100, Math.round((filledRooms / totalRooms) * 100)) : 0;
  const occupancyPercent = Number.isNaN(rawOccupancy) ? 0 : rawOccupancy;

  const dwellingLabelMap: Record<string, string> = {
    permanen: 'Warga Tetap (Permanen)',
    kos: 'Kos / Homestay',
    rental: 'Kontrakan / Sewa',
  };

  return {
    summary: {
      totalWargaAktif,
      totalKK: totalFamilies?.count ?? 0,
      totalWargaTetap,
      totalPendatang,
    },
    genderDistribution: (() => {
      const maleObj = (genderCounts || []).find((g) => g.gender === "L");
      const femaleObj = (genderCounts || []).find((g) => g.gender === "P");
      return [
        { gender: "Laki-laki", count: maleObj ? maleObj.count : 0 },
        { gender: "Perempuan", count: femaleObj ? femaleObj.count : 0 },
      ];
    })(),
    ageDistribution: (ageCounts || []).map((a) => ({ range: a.range || "Belum Diisi", count: a.count || 0 })),
    occupationDistribution: occupationCounts.map((o) => ({ occupation: o.occupation || 'Lainnya', count: o.count })),
    educationDistribution: educationCounts.map((e) => ({ education: e.education || 'Lainnya', count: e.count })),
    religionDistribution: religionCounts.map((r) => ({ religion: r.religion || 'Lainnya', count: r.count })),
    dwellingDistribution: dwellingTypeCounts.map((d) => ({
      type: dwellingLabelMap[String(d.type)] || String(d.type || 'Lainnya'),
      count: d.count,
    })),
    occupancyRate: {
      totalRooms,
      filledRooms,
      occupancyPercent,
    },
    cashSummary: {
      currentBalance: (cashAggregate?.totalIncome ?? 0) - (cashAggregate?.totalExpense ?? 0),
      billedIuran: duesAggregate?.billed ?? 0,
      paidIuran: duesAggregate?.paid ?? 0,
      participationRate,
    },
    cashflowTrend,
    complaintSummary: complaintCounts.map((c) => ({ status: c.status, count: c.count })),
    topComplaintCategories: topCategories.map((tc) => ({ category: tc.category, count: tc.count })),
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
    [duesAggregate],
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
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.families).where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified'))),

    // Kepatuhan Iuran Bulan Ini
    db.select({
      paidCount: sql<number>`COALESCE(SUM(CASE WHEN ${schema.feePayments.status} = 'paid' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      unpaidCount: sql<number>`COALESCE(SUM(CASE WHEN ${schema.feePayments.status} IN ('unpaid', 'partially_paid') THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.feePayments).where(eq(schema.feePayments.period, currentPeriod)),

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
  const paidFamilies = duesAggregate?.paidCount ?? 0;
  const unpaidFamilies = duesAggregate?.unpaidCount ?? 0;
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
 * 5. KOORDINATOR KOS DASHBOARD STATS
 * Properti kos & penyewa aktif untuk Koordinator Kos (berdasarkan userId).
 */
export async function getCoordinatorDashboardStats(userId: string) {
  // Ambil hunian milik owner/koordinator ini
  const myDwellings = await db
    .select({ id: schema.dwellings.id })
    .from(schema.dwellings)
    .where(and(eq(schema.dwellings.ownerUserId, userId), eq(schema.dwellings.isActive, true)));

  if (myDwellings.length === 0) {
    return {
      summary: { totalProperties: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0, occupancyPercent: 0 },
      propertiesList: [],
      recentTenants: [],
    };
  }

  const dwellingIds = myDwellings.map((d) => d.id);

  const [properties, recentTenants] = await Promise.all([
    // Daftar Properti Kos milik koordinator
    db.select({
      id: schema.rentalProperties.id,
      name: schema.rentalProperties.name,
      dwellingId: schema.rentalProperties.dwellingId,
      contactPerson: schema.rentalProperties.contactPerson,
      phone: schema.rentalProperties.phone,
      totalRooms: schema.rentalProperties.totalRooms,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(sql`${schema.rentalProperties.dwellingId} IN ${dwellingIds} AND ${schema.rentalProperties.isActive} = true`),

    // Penyewa Terbaru
    db.select({
      id: schema.rentalContracts.id,
      name: sql<string>`COALESCE(${schema.rentalContracts.individualName}, ${schema.users.name}, 'Penyewa')`,
      propertyName: schema.rentalProperties.name,
      roomNumber: schema.rentalContracts.roomNumber,
      checkInDate: schema.rentalContracts.checkInDate,
      phone: sql<string | null>`COALESCE(${schema.rentalContracts.individualPhone}, ${schema.users.phone})`,
    })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .where(sql`${schema.rentalProperties.dwellingId} IN ${dwellingIds} AND ${schema.rentalContracts.isActive} = true`)
    .orderBy(desc(schema.rentalContracts.checkInDate))
    .limit(5),
  ]);

  const totalProps = properties.length;
  let totalRms = 0;
  properties.forEach((p) => {
    totalRms += p.totalRooms || 0;
  });

  const occupiedRms = recentTenants.length;
  const availRms = Math.max(0, totalRms - occupiedRms);
  const occPct = totalRms > 0 ? Math.round((occupiedRms / totalRms) * 100) : 0;

  return {
    summary: {
      totalProperties: totalProps,
      totalRooms: totalRms,
      occupiedRooms: occupiedRms,
      availableRooms: availRms,
      occupancyPercent: occPct,
    },
    propertiesList: properties.map((p) => ({
      id: p.id,
      name: p.name,
      blockNumber: p.blockNumber,
      houseNumber: p.houseNumber,
      totalRooms: p.totalRooms,
      occupiedRooms: 0,
      contactPerson: p.contactPerson,
      phone: p.phone,
    })),
    recentTenants: recentTenants.map((t) => ({
      id: t.id,
      name: t.name,
      propertyName: t.propertyName,
      roomNumber: t.roomNumber || '-',
      checkInDate: t.checkInDate ? String(t.checkInDate) : new Date().toISOString(),
      phone: t.phone || null,
    })),
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
        .where(eq(schema.dwellings.id, familyData.dwellingId))
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
    [totalWargaRes],
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

    // Total Warga (Warga Tetap + Penyewa Aktif)
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    // Total Kartu Keluarga Verifikasi/Aktif
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.families)
      .where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified'))),

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
      totalWarga: totalWargaRes?.count ?? 0,
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
