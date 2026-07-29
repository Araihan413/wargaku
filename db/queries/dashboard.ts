import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, sql, desc, gte, lte, inArray, count } from "drizzle-orm";
import { startOfMonth, subMonths, format } from "date-fns";

// ==========================================
// DASHBOARD QUERIES
// ==========================================

/**
 * Warga Dashboard Data Query
 */
export async function getWargaDashboard(userId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      nik: schema.users.nik,
      roleId: schema.users.roleId,
      dwellingId: schema.users.dwellingId,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  let dwellingData = null;
  if (user?.dwellingId) {
    const [dwelling] = await db
      .select({
        id: schema.dwellings.id,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        qrToken: schema.dwellings.qrToken,
        type: schema.dwellings.type,
        latitude: schema.dwellings.latitude,
        longitude: schema.dwellings.longitude,
      })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, user.dwellingId));
    if (dwelling) dwellingData = dwelling;
  }

  let familyData: {
    id: number;
    familyNumber: string;
    verificationStatus: "draft" | "pending" | "verified" | "rejected";
    verificationNote: string | null;
    headName: string;
    hasVerified: boolean;
    totalMembers: number;
  } | null = null;

  const [headFamily] = await db
    .select({
      id: schema.families.id,
      familyNumber: schema.families.familyNumber,
      verificationStatus: schema.families.verificationStatus,
      verificationNote: schema.families.verificationNote,
      headName: schema.families.headName,
      hasVerified: schema.families.hasVerified,
    })
    .from(schema.families)
    .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)));

  if (headFamily) {
    const [membersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.residents)
      .where(and(eq(schema.residents.familyId, headFamily.id), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

    familyData = {
      ...headFamily,
      totalMembers: membersCount?.count || 0,
    };
  } else if (user?.nik) {
    const [member] = await db
      .select({ familyId: schema.residents.familyId })
      .from(schema.residents)
      .where(and(eq(schema.residents.nik, user.nik), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

    if (member && member.familyId) {
      const [foundFamily] = await db
        .select({
          id: schema.families.id,
          familyNumber: schema.families.familyNumber,
          verificationStatus: schema.families.verificationStatus,
          verificationNote: schema.families.verificationNote,
          headName: schema.families.headName,
          hasVerified: schema.families.hasVerified,
        })
        .from(schema.families)
        .where(eq(schema.families.id, member.familyId));

      if (foundFamily) {
        const [membersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.residents)
          .where(and(eq(schema.residents.familyId, foundFamily.id), eq(schema.residents.residentType, 'warga_tetap'), eq(schema.residents.isActive, true)));

        familyData = {
          ...foundFamily,
          totalMembers: membersCount?.count || 0,
        };
      }
    }
  }

  const latestAnnouncements = await db
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
    .limit(3);

  const now = new Date();
  const upcomingActivities = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
    })
    .from(schema.activities)
    .where(gte(schema.activities.eventDate, now))
    .orderBy(schema.activities.eventDate)
    .limit(3);

  const approvedTransactions = await db
    .select({
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
    })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.status, "approved"));

  let totalIncome = 0;
  let totalExpense = 0;
  approvedTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") totalIncome += amt;
    if (tx.type === "expense") totalExpense += amt;
  });

  const officers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      phone: schema.users.phone,
      roleId: schema.users.roleId,
    })
    .from(schema.users)
    .where(and(inArray(schema.users.roleId, [2, 3, 4]), eq(schema.users.status, "active")));

  const officerContacts = officers.map((off) => ({
    id: off.id,
    name: off.name,
    phone: off.phone || "-",
    roleTitle:
      off.roleId === 2
        ? "Ketua RT"
        : off.roleId === 3
        ? "Sekretaris RT"
        : off.roleId === 4
        ? "Bendahara RT"
        : "Pengurus",
  }));

  const [wargaCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.residents)
    .where(eq(schema.residents.isActive, true));

  const [kkCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.families)
    .where(eq(schema.families.isActive, true));

  return {
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      dwellingId: user?.dwellingId,
    },
    family: familyData,
    dwelling: dwellingData,
    announcements: latestAnnouncements,
    activities: upcomingActivities,
    finance: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
    officerContacts,
    stats: {
      totalWarga: wargaCount?.count || 0,
      totalKK: kkCount?.count || 0,
    },
  };
}

/**
 * Treasurer Dashboard Stats Query
 */
export async function getTreasurerStats() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentPeriod = `${currentYear}-${currentMonth}`;

  const startOfMonth = new Date(currentYear, now.getMonth(), 1);
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);

  const [totalCashIncomeResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.cashTransactions.amount}), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.type, "income"));

  const [totalFeePaidResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number) })
    .from(schema.feePayments);

  const [totalExpenseResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.cashTransactions.amount}), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "expense"), eq(schema.cashTransactions.status, "approved")));

  const totalIncome = (totalCashIncomeResult?.total || 0) + (totalFeePaidResult?.total || 0);
  const totalExpense = totalExpenseResult?.total || 0;
  const totalBalance = totalIncome - totalExpense;

  const [monthCashIncomeResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.cashTransactions.amount}), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(
      and(
        eq(schema.cashTransactions.type, "income"),
        gte(schema.cashTransactions.transactionDate, startOfMonth),
        lte(schema.cashTransactions.transactionDate, endOfMonth)
      )
    );

  const [monthFeePaidResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number) })
    .from(schema.feePayments)
    .where(eq(schema.feePayments.period, currentPeriod));

  const thisMonthIncome = (monthCashIncomeResult?.total || 0) + (monthFeePaidResult?.total || 0);

  const [monthExpenseResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.cashTransactions.amount}), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(
      and(
        eq(schema.cashTransactions.type, "expense"),
        eq(schema.cashTransactions.status, "approved"),
        gte(schema.cashTransactions.transactionDate, startOfMonth),
        lte(schema.cashTransactions.transactionDate, endOfMonth)
      )
    );

  const thisMonthExpense = monthExpenseResult?.total || 0;

  const [activeFamiliesResult] = await db
    .select({ total: sql<number>`COUNT(*)`.mapWith(Number) })
    .from(schema.families)
    .where(and(eq(schema.families.isActive, true), eq(schema.families.hasVerified, true)));

  const totalActiveFamilies = activeFamiliesResult?.total || 0;

  const [paidFamiliesResult] = await db
    .select({ total: sql<number>`COUNT(DISTINCT ${schema.feePayments.familyId})`.mapWith(Number) })
    .from(schema.feePayments)
    .where(and(eq(schema.feePayments.period, currentPeriod), eq(schema.feePayments.status, "paid")));

  const paidFamiliesCount = paidFamiliesResult?.total || 0;
  const unpaidFamiliesCount = Math.max(0, totalActiveFamilies - paidFamiliesCount);
  const duesPaidPercentage = totalActiveFamilies > 0 ? Math.round((paidFamiliesCount / totalActiveFamilies) * 100) : 0;

  const recentCash = await db
    .select({
      id: schema.cashTransactions.id,
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      date: schema.cashTransactions.transactionDate,
      category: schema.cashTransactions.category,
      description: schema.cashTransactions.description,
      receiptFile: schema.cashTransactions.receiptFile,
      status: schema.cashTransactions.status,
      createdAt: schema.cashTransactions.createdAt,
    })
    .from(schema.cashTransactions)
    .orderBy(desc(schema.cashTransactions.createdAt))
    .limit(5);

  const recentFees = await db
    .select({
      id: schema.feePayments.id,
      amount: schema.feePayments.amountPaid,
      date: schema.feePayments.paymentDate,
      period: schema.feePayments.period,
      status: schema.feePayments.status,
      createdAt: schema.feePayments.createdAt,
      familyNumber: schema.families.familyNumber,
      headName: schema.families.headName,
    })
    .from(schema.feePayments)
    .innerJoin(schema.families, eq(schema.feePayments.familyId, schema.families.id))
    .orderBy(desc(schema.feePayments.createdAt))
    .limit(5);

  const formattedTransactions = [
    ...recentCash.map((c) => ({
      id: `cash-${c.id}`,
      title: c.description || `Transaksi ${c.category}`,
      category: c.category,
      amount: Number(c.amount),
      type: c.type as "income" | "expense",
      date: c.date ? String(c.date) : String(c.createdAt),
      receiptFile: c.receiptFile,
      status: c.status,
    })),
    ...recentFees.map((f) => ({
      id: `fee-${f.id}`,
      title: `Iuran KK ${f.familyNumber} (${f.headName})`,
      category: `Iuran ${f.period}`,
      amount: Number(f.amount),
      type: "income" as const,
      date: f.date ? String(f.date) : String(f.createdAt),
      receiptFile: null,
      status: f.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return {
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    duesStats: {
      totalActiveFamilies,
      paidFamiliesCount,
      unpaidFamiliesCount,
      duesPaidPercentage,
      currentPeriod,
    },
    recentTransactions: formattedTransactions,
  };
}

/**
 * Secretary Dashboard Stats Query
 */
export async function getSecretaryStats() {
  const [pendingRegsRes] = await db
    .select({ count: count() })
    .from(schema.users)
    .where(eq(schema.users.status, "pending"));

  const [newComplaintsRes] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, "menunggu"));

  const now = new Date();
  const [upcomingActRes] = await db
    .select({ count: count() })
    .from(schema.activities)
    .where(gte(schema.activities.eventDate, now));

  const summary = {
    pendingRegistrations: pendingRegsRes?.count || 0,
    newComplaints: newComplaintsRes?.count || 0,
    upcomingActivities: upcomingActRes?.count || 0,
  };

  const pendingUsers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      nik: schema.users.nik,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.status, "pending"))
    .orderBy(desc(schema.users.createdAt))
    .limit(5);

  const pendingRegistrations = pendingUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    nik: u.nik,
    createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
    address: "Registrasi Mandiri",
  }));

  const upcomingActRaw = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
    })
    .from(schema.activities)
    .where(gte(schema.activities.eventDate, now))
    .orderBy(schema.activities.eventDate)
    .limit(3);

  const upcomingActivities = upcomingActRaw.map((a) => ({
    id: a.id,
    title: a.title,
    eventDate: a.eventDate ? a.eventDate.toISOString() : new Date().toISOString(),
    location: a.location,
    isPinned: a.isPinned,
  }));

  const latestAnnRaw = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      publishedAt: schema.announcements.publishedAt,
    })
    .from(schema.announcements)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(3);

  const latestAnnouncements = latestAnnRaw.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
  }));

  const complaintsRaw = await db
    .select({
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
    .limit(3);

  const recentComplaints = complaintsRaw.map((c) => ({
    id: c.id,
    trackingCode: c.trackingCode,
    reporterName: c.reporterName,
    category: c.category,
    description: c.description,
    status: c.status,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
  }));

  return {
    summary,
    pendingRegistrations,
    upcomingActivities,
    latestAnnouncements,
    recentComplaints,
  };
}

/**
 * RT Dashboard Stats Query
 */
export async function getRtStats() {
  const today = new Date();

  const activeResidents = await db
    .select({
      residentType: schema.residents.residentType,
      gender: schema.residents.gender,
      birthDate: schema.residents.birthDate,
      occupation: schema.residents.occupation,
      educationLevel: schema.residents.educationLevel,
      religion: schema.residents.religion,
    })
    .from(schema.residents)
    .where(eq(schema.residents.isActive, true));

  const activeWargaTetap = activeResidents.filter((r) => r.residentType === "warga_tetap");
  const activeWargaSewa = activeResidents.filter((r) => r.residentType !== "warga_tetap");
  const allResidents = activeResidents;

  const totalWargaTetap = activeWargaTetap.length;
  const totalPendatang = activeWargaSewa.length;
  const totalWargaAktif = totalWargaTetap + totalPendatang;

  const [familiesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.families)
    .where(eq(schema.families.isActive, true));
  const totalKK = familiesCount?.count || 0;

  const genderCounts = activeWargaTetap.reduce(
    (acc, r) => {
      if (r.gender === "L") acc.L++;
      if (r.gender === "P") acc.P++;
      return acc;
    },
    { L: 0, P: 0 }
  );
  const genderDistribution = [
    { gender: "Laki-laki", count: genderCounts.L },
    { gender: "Perempuan", count: genderCounts.P },
  ];

  const getAge = (birthDateStr: string | Date | null) => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const ageCounts = { balita: 0, anak: 0, remaja: 0, produktif: 0, lansia: 0 };
  activeWargaTetap.forEach((r) => {
    const age = getAge(r.birthDate);
    if (age === null) return;
    if (age <= 5) ageCounts.balita++;
    else if (age <= 12) ageCounts.anak++;
    else if (age <= 18) ageCounts.remaja++;
    else if (age <= 59) ageCounts.produktif++;
    else ageCounts.lansia++;
  });

  const ageDistribution = [
    { range: "Balita (0-5 th)", count: ageCounts.balita },
    { range: "Anak (6-12 th)", count: ageCounts.anak },
    { range: "Remaja (13-18 th)", count: ageCounts.remaja },
    { range: "Produktif (19-59 th)", count: ageCounts.produktif },
    { range: "Lansia (>=60 th)", count: ageCounts.lansia },
  ];

  const occupationCounts: Record<string, number> = {};
  allResidents.forEach((r) => {
    const occ = r.occupation?.trim() || "Tidak Bekerja / Lainnya";
    occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
  });
  const occupationDistribution = Object.entries(occupationCounts)
    .map(([occupation, count]) => ({ occupation, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const educationCounts: Record<string, number> = {};
  allResidents.forEach((r) => {
    const edu = r.educationLevel?.trim() || "Tidak Sekolah / Lainnya";
    educationCounts[edu] = (educationCounts[edu] || 0) + 1;
  });
  const educationDistribution = Object.entries(educationCounts)
    .map(([education, count]) => ({ education, count }))
    .sort((a, b) => b.count - a.count);

  const religionCounts: Record<string, number> = {
    Islam: 0,
    Kristen: 0,
    Katolik: 0,
    Hindu: 0,
    Buddha: 0,
    Khonghucu: 0,
    Lainnya: 0,
  };
  allResidents.forEach((r) => {
    const rel = r.religion || "Lainnya";
    if (religionCounts[rel] !== undefined) {
      religionCounts[rel]++;
    } else {
      religionCounts.Lainnya++;
    }
  });
  const religionDistribution = Object.entries(religionCounts)
    .map(([religion, count]) => ({ religion, count }))
    .filter((item) => item.count > 0);

  const allDwellings = await db
    .select({
      id: schema.dwellings.id,
      type: schema.dwellings.type,
    })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.isActive, true));

  const activeFamilies = await db
    .select({ dwellingId: schema.families.dwellingId })
    .from(schema.families)
    .where(eq(schema.families.isActive, true));

  const occupiedDwellingIds = new Set<number>();
  activeFamilies.forEach((f) => occupiedDwellingIds.add(f.dwellingId));

  const activeRentals = await db
    .select({
      id: schema.rentalProperties.id,
      dwellingId: schema.rentalProperties.dwellingId,
      totalRooms: schema.rentalProperties.totalRooms,
    })
    .from(schema.rentalProperties)
    .where(eq(schema.rentalProperties.isActive, true));

  const activeTenants = await db
    .select({ rentalPropertyId: schema.residents.rentalPropertyId })
    .from(schema.residents)
    .where(and(eq(schema.residents.isActive, true), sql`${schema.residents.rentalPropertyId} IS NOT NULL`));

  const occupiedRentalPropertyIds = new Set(activeTenants.map((t) => t.rentalPropertyId));
  activeRentals.forEach((r) => {
    if (occupiedRentalPropertyIds.has(r.id)) {
      occupiedDwellingIds.add(r.dwellingId);
    }
  });

  const dwellingCounts = { permanen: 0, kos: 0, homestay: 0, kosong: 0 };
  allDwellings.forEach((d) => {
    if (!occupiedDwellingIds.has(d.id)) {
      dwellingCounts.kosong++;
    } else {
      if (d.type === "permanen") dwellingCounts.permanen++;
      else if (d.type === "kos") dwellingCounts.kos++;
      else if (d.type === "homestay") dwellingCounts.homestay++;
    }
  });

  const dwellingDistribution = [
    { type: "Rumah Tetap", count: dwellingCounts.permanen },
    { type: "Kos / Kontrakan", count: dwellingCounts.kos },
    { type: "Homestay", count: dwellingCounts.homestay },
    { type: "Rumah Kosong", count: dwellingCounts.kosong },
  ];

  const totalRooms = activeRentals.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
  const filledRooms = totalPendatang;
  const occupancyPercent = totalRooms > 0 ? Math.round((filledRooms / totalRooms) * 100) : 0;
  const occupancyRate = { totalRooms, filledRooms, occupancyPercent };

  const incomeTransactions = await db
    .select({ amount: schema.cashTransactions.amount })
    .from(schema.cashTransactions)
    .where(eq(schema.cashTransactions.type, "income"));

  const expenseTransactions = await db
    .select({ amount: schema.cashTransactions.amount })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "expense"), eq(schema.cashTransactions.status, "approved")));

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const currentBalance = totalIncome - totalExpense;

  const currentPeriod = format(today, "yyyy-MM");
  const iuranPayments = await db
    .select({
      amountBilled: schema.feePayments.amountBilled,
      amountPaid: schema.feePayments.amountPaid,
      status: schema.feePayments.status,
    })
    .from(schema.feePayments)
    .where(eq(schema.feePayments.period, currentPeriod));

  const billedIuran = iuranPayments.reduce((sum, p) => sum + parseFloat(p.amountBilled.toString()), 0);
  const paidIuran = iuranPayments.reduce((sum, p) => sum + parseFloat(p.amountPaid.toString()), 0);
  const paidCount = iuranPayments.filter((p) => p.status === "paid").length;
  const totalKKWithBilled = iuranPayments.length;
  const participationRate = totalKKWithBilled > 0 ? Math.round((paidCount / totalKKWithBilled) * 100) : 0;

  const cashSummary = {
    currentBalance,
    billedIuran,
    paidIuran,
    participationRate,
  };

  const sixMonthsAgo = subMonths(startOfMonth(today), 5);
  const pastTransactions = await db
    .select({
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      status: schema.cashTransactions.status,
      date: schema.cashTransactions.transactionDate,
    })
    .from(schema.cashTransactions)
    .where(gte(schema.cashTransactions.transactionDate, sixMonthsAgo));

  const monthlyCashflow: Record<string, { income: number; expense: number }> = {};
  for (let i = 0; i < 6; i++) {
    const monthStr = format(subMonths(today, i), "MMM yyyy");
    monthlyCashflow[monthStr] = { income: 0, expense: 0 };
  }

  pastTransactions.forEach((t) => {
    const mStr = format(new Date(t.date), "MMM yyyy");
    if (monthlyCashflow[mStr] !== undefined) {
      const amt = parseFloat(t.amount.toString());
      if (t.type === "income") {
        monthlyCashflow[mStr].income += amt;
      } else if (t.type === "expense" && t.status === "approved") {
        monthlyCashflow[mStr].expense += amt;
      }
    }
  });

  const cashflowTrend = Object.entries(monthlyCashflow)
    .map(([month, data]) => ({ month, ...data }))
    .reverse();

  const activeComplaints = await db.select().from(schema.complaints);
  const complaintStatusCounts = { menunggu: 0, proses: 0, selesai: 0, ditolak: 0 };
  const complaintCategoryCounts: Record<string, number> = {
    Infrastruktur: 0,
    Kebersihan: 0,
    Keamanan: 0,
    Sosial: 0,
    Lainnya: 0,
  };

  activeComplaints.forEach((c) => {
    if (complaintStatusCounts[c.status] !== undefined) {
      complaintStatusCounts[c.status]++;
    }
    if (complaintCategoryCounts[c.category] !== undefined) {
      complaintCategoryCounts[c.category]++;
    }
  });

  const complaintSummary = Object.entries(complaintStatusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  const topComplaintCategories = Object.entries(complaintCategoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const activeRentalsHistory = await db
    .select({
      checkInDate: schema.residents.checkInDate,
      checkOutDate: schema.residents.checkOutDate,
    })
    .from(schema.residents)
    .where(or(eq(schema.residents.residentType, 'sewa_perorangan'), eq(schema.residents.residentType, 'sewa_keluarga')));

  const permanentFamiliesHistory = await db
    .select({
      id: schema.families.id,
      checkInDate: schema.families.checkInDate,
      checkOutDate: schema.families.checkOutDate,
    })
    .from(schema.families);

  const familyMembersCount = await db
    .select({ familyId: schema.residents.familyId })
    .from(schema.residents)
    .where(and(eq(schema.residents.isActive, true), eq(schema.residents.residentType, 'warga_tetap')));

  const familySizeMap: Record<number, number> = {};
  familyMembersCount.forEach((fm) => {
    if (fm.familyId) {
      familySizeMap[fm.familyId] = (familySizeMap[fm.familyId] || 0) + 1;
    }
  });

  const monthlyMutations: Record<string, { checkIn: number; checkOut: number }> = {};
  for (let i = 0; i < 6; i++) {
    const monthStr = format(subMonths(today, i), "MMM yyyy");
    monthlyMutations[monthStr] = { checkIn: 0, checkOut: 0 };
  }

  activeRentalsHistory.forEach((r) => {
    if (r.checkInDate) {
      const checkInMonth = format(new Date(r.checkInDate), "MMM yyyy");
      if (monthlyMutations[checkInMonth] !== undefined) {
        monthlyMutations[checkInMonth].checkIn++;
      }
    }
    if (r.checkOutDate) {
      const checkOutMonth = format(new Date(r.checkOutDate), "MMM yyyy");
      if (monthlyMutations[checkOutMonth] !== undefined) {
        monthlyMutations[checkOutMonth].checkOut++;
      }
    }
  });

  permanentFamiliesHistory.forEach((f) => {
    const size = familySizeMap[f.id] || 1;
    if (f.checkInDate) {
      const checkInMonth = format(new Date(f.checkInDate), "MMM yyyy");
      if (monthlyMutations[checkInMonth] !== undefined) {
        monthlyMutations[checkInMonth].checkIn += size;
      }
    }
    if (f.checkOutDate) {
      const checkOutMonth = format(new Date(f.checkOutDate), "MMM yyyy");
      if (monthlyMutations[checkOutMonth] !== undefined) {
        monthlyMutations[checkOutMonth].checkOut += size;
      }
    }
  });

  const populationMutations = Object.entries(monthlyMutations)
    .map(([month, data]) => ({ month, ...data }))
    .reverse();

  return {
    summary: {
      totalWargaAktif,
      totalKK,
      totalWargaTetap,
      totalPendatang,
    },
    genderDistribution,
    ageDistribution,
    occupationDistribution,
    educationDistribution,
    religionDistribution,
    dwellingDistribution,
    occupancyRate,
    cashSummary,
    cashflowTrend,
    complaintSummary,
    topComplaintCategories,
    populationMutations,
  };
}

/**
 * Coordinator Dashboard Stats Query
 */
export async function getCoordinatorStats(userId: string, roleId: number) {
  let propertiesQuery;
  if (roleId === 1 || roleId === 2) {
    propertiesQuery = db
      .select({
        id: schema.rentalProperties.id,
        name: schema.rentalProperties.name,
        dwellingId: schema.rentalProperties.dwellingId,
        totalRooms: schema.rentalProperties.totalRooms,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        type: schema.dwellings.type,
      })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .where(eq(schema.rentalProperties.isActive, true));
  } else {
    propertiesQuery = db
      .select({
        id: schema.rentalProperties.id,
        name: schema.rentalProperties.name,
        dwellingId: schema.rentalProperties.dwellingId,
        totalRooms: schema.rentalProperties.totalRooms,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        type: schema.dwellings.type,
      })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .where(and(eq(schema.rentalProperties.coordinatorUserId, userId), eq(schema.rentalProperties.isActive, true)));
  }

  const properties = await propertiesQuery;
  const propertyIds = properties.map((p) => p.id);

  if (propertyIds.length === 0) {
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

  const activeResidents = await db
    .select({
      id: schema.residents.id,
      rentalPropertyId: schema.residents.rentalPropertyId,
      verificationStatus: schema.residents.verificationStatus,
    })
    .from(schema.residents)
    .where(and(inArray(schema.residents.rentalPropertyId, propertyIds), eq(schema.residents.isActive, true)));

  const propertyBreakdown = properties.map((p) => {
    const occupied = activeResidents.filter((r) => r.rentalPropertyId === p.id).length;
    const vacant = Math.max(p.totalRooms - occupied, 0);
    const occupancyRate = p.totalRooms > 0 ? Math.round((occupied / p.totalRooms) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      address: `Blok ${p.blockNumber} No. ${p.houseNumber}`,
      type: p.type,
      totalRooms: p.totalRooms,
      occupiedRooms: occupied,
      vacantRooms: vacant,
      occupancyRate,
    };
  });

  const totalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
  const occupiedRooms = activeResidents.length;
  const vacantRooms = Math.max(totalRooms - occupiedRooms, 0);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const pendingVerifications = activeResidents.filter((r) => r.verificationStatus === 'pending').length;

  const pendingQueueRaw = await db
    .select({
      id: schema.residents.id,
      name: schema.residents.name,
      nik: schema.residents.nik,
      residentType: schema.residents.residentType,
      roomNumber: schema.residents.roomNumber,
      checkInDate: schema.residents.checkInDate,
      verificationStatus: schema.residents.verificationStatus,
      ktpFile: schema.residents.ktpFile,
      rentalPropertyId: schema.residents.rentalPropertyId,
    })
    .from(schema.residents)
    .where(
      and(
        inArray(schema.residents.rentalPropertyId, propertyIds),
        eq(schema.residents.isActive, true),
        eq(schema.residents.verificationStatus, 'pending')
      )
    )
    .orderBy(desc(schema.residents.createdAt))
    .limit(5);

  const pendingQueue = pendingQueueRaw.map((r) => {
    const prop = properties.find((p) => p.id === r.rentalPropertyId);
    return {
      id: r.id,
      name: r.name,
      nik: r.nik,
      tenantType: r.residentType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
      roomNumber: r.roomNumber,
      checkInDate: r.checkInDate,
      verificationStatus: r.verificationStatus,
      ktpFile: r.ktpFile,
      propertyName: prop ? prop.name : 'Properti Sewa',
    };
  });

  return {
    summary: {
      totalProperties: properties.length,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      pendingVerifications,
      totalActiveResidents: occupiedRooms,
    },
    propertyBreakdown,
    pendingQueue,
  };
}
