import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, gte, sql, like, or, SQL } from "drizzle-orm";
import { getSystemSettings } from "./system-settings";

export interface PublicAnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: "umum" | "penting" | "mendesak";
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  creatorName: string | null;
}

export interface PublicActivityItem {
  id: number;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  isPinned: boolean;
  createdAt: string;
}

export interface PublicDemographicsData {
  totalHouses: number;
  totalResidents: number;
  totalFamilies: number;
  totalRenters: number;
  // Breakdown
  ageDistribution: { label: string; count: number; percentage: number; color: string }[];
  genderRatio: { male: number; female: number; malePct: number; femalePct: number };
  educationDistribution: { label: string; count: number }[];
  occupationDistribution: { label: string; count: number }[];
  dwellingStatus: { terisi: number; kos: number; kosong: number };
  complaintsByCategory: { category: string; count: number; color: string }[];
}

export interface PublicFinanceSummary {
  saldoAwal: number;
  pemasukan: number;
  pengeluaran: number;
  saldoAkhir: number;
}

export interface EmergencyContactItem {
  name: string;
  phone: string;
  subtitle?: string;
}

export async function getPublicPortalData() {
  // 1. System Settings
  const settings = await getSystemSettings();

  // 2. Announcements (Latest 3 for preview grid)
  const rawAnnouncements = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
      creatorName: schema.users.name,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt))
    .limit(3);

  const announcements: PublicAnnouncementItem[] = rawAnnouncements.map((a) => ({
    ...a,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  // 3. Upcoming Activities (Latest 2 for preview grid)
  const now = new Date();
  const rawActivities = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
      createdAt: schema.activities.createdAt,
    })
    .from(schema.activities)
    .where(gte(schema.activities.eventDate, now))
    .orderBy(desc(schema.activities.isPinned), schema.activities.eventDate)
    .limit(2);

  const activities: PublicActivityItem[] = rawActivities.map((a) => ({
    ...a,
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  // 4. Demographics Calculations (100% Real Database Queries)
  const [housesRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.isActive, true));
  const totalHouses = housesRes?.count || 0;

  const [familiesRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.families)
    .where(eq(schema.families.isActive, true));
  const totalFamilies = familiesRes?.count || 0;

  const activeResidents = await db
    .select({
      id: schema.residents.id,
      residentType: schema.residents.residentType,
      gender: schema.residents.gender,
      birthDate: schema.residents.birthDate,
      occupation: schema.residents.occupation,
      educationLevel: schema.residents.educationLevel,
    })
    .from(schema.residents)
    .where(eq(schema.residents.isActive, true));

  const totalResidents = activeResidents.length;
  const totalRenters = activeResidents.filter(
    (r) => r.residentType === "sewa_perorangan" || r.residentType === "sewa_keluarga"
  ).length;

  // Age Distribution Calculation from DB
  const today = new Date();
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
  activeResidents.forEach((r) => {
    const age = getAge(r.birthDate);
    if (age === null) return;
    if (age <= 5) ageCounts.balita++;
    else if (age <= 12) ageCounts.anak++;
    else if (age <= 18) ageCounts.remaja++;
    else if (age <= 59) ageCounts.produktif++;
    else ageCounts.lansia++;
  });

  const validAgeTotal = Math.max(
    1,
    ageCounts.balita + ageCounts.anak + ageCounts.remaja + ageCounts.produktif + ageCounts.lansia
  );

  const ageDistribution = [
    {
      label: "0 - 5 th (Balita)",
      count: ageCounts.balita,
      percentage: Math.round((ageCounts.balita / validAgeTotal) * 100),
      color: "#8b5cf6",
    },
    {
      label: "6 - 12 th (Anak)",
      count: ageCounts.anak,
      percentage: Math.round((ageCounts.anak / validAgeTotal) * 100),
      color: "#06b6d4",
    },
    {
      label: "13 - 18 th (Remaja)",
      count: ageCounts.remaja,
      percentage: Math.round((ageCounts.remaja / validAgeTotal) * 100),
      color: "#eab308",
    },
    {
      label: "19 - 59 th (Dewasa)",
      count: ageCounts.produktif,
      percentage: Math.round((ageCounts.produktif / validAgeTotal) * 100),
      color: "#3b82f6",
    },
    {
      label: "> 60 th (Lansia)",
      count: ageCounts.lansia,
      percentage: Math.round((ageCounts.lansia / validAgeTotal) * 100),
      color: "#ef4444",
    },
  ];

  // Gender Ratio Calculation from DB
  const maleCount = activeResidents.filter((r) => r.gender === "L").length;
  const femaleCount = activeResidents.filter((r) => r.gender === "P").length;
  const genderTotal = Math.max(1, maleCount + femaleCount);
  const malePct = Math.round((maleCount / genderTotal) * 100);
  const femalePct = Math.round((femaleCount / genderTotal) * 100);

  const genderRatio = {
    male: maleCount,
    female: femaleCount,
    malePct,
    femalePct,
  };

  // Education Level Distribution (All DB Data Entries)
  const educationCounts: Record<string, number> = {};
  activeResidents.forEach((r) => {
    const edu = r.educationLevel?.trim() || "Belum / Tidak Sekolah";
    educationCounts[edu] = (educationCounts[edu] || 0) + 1;
  });
  const educationDistribution = Object.entries(educationCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Occupation Distribution (All DB Data Entries)
  const occupationCounts: Record<string, number> = {};
  activeResidents.forEach((r) => {
    const occ = r.occupation?.trim() || "Tidak Bekerja / Lainnya";
    occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
  });
  const occupationDistribution = Object.entries(occupationCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Dwelling Status Calculation from DB
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

  const dwellingCounts = { terisi: 0, kos: 0, kosong: 0 };
  allDwellings.forEach((d) => {
    if (!occupiedDwellingIds.has(d.id)) {
      dwellingCounts.kosong++;
    } else {
      if (d.type === "permanen") dwellingCounts.terisi++;
      else dwellingCounts.kos++;
    }
  });

  // Complaints By Category Calculation from DB
  const rawComplaints = await db
    .select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.complaints)
    .groupBy(schema.complaints.category);

  const complaintCategoryMap: Record<string, number> = {
    Infrastruktur: 0,
    Kebersihan: 0,
    Keamanan: 0,
    Sosial: 0,
    Lainnya: 0,
  };

  rawComplaints.forEach((c) => {
    if (complaintCategoryMap[c.category] !== undefined) {
      complaintCategoryMap[c.category] = c.count;
    }
  });

  const categoryColors: Record<string, string> = {
    Keamanan: "#3b82f6",
    Sosial: "#22c55e",
    Infrastruktur: "#ef4444",
    Kebersihan: "#f97316",
    Lainnya: "#06b6d4",
  };

  const complaintsByCategory = Object.entries(complaintCategoryMap).map(([category, count]) => ({
    category,
    count,
    color: categoryColors[category] || "#3b82f6",
  }));

  // Cash Finance Summary Calculation from DB
  const [incomeSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "income"), eq(schema.cashTransactions.status, "approved")));

  const [expenseSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "expense"), eq(schema.cashTransactions.status, "approved")));

  const [feePaidSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number) })
    .from(schema.feePayments);

  const pemasukan = (incomeSum?.total || 0) + (feePaidSum?.total || 0);
  const pengeluaran = expenseSum?.total || 0;
  const saldoAwal = 0;
  const saldoAkhir = pemasukan - pengeluaran;

  const demographics: PublicDemographicsData = {
    totalHouses,
    totalResidents,
    totalFamilies,
    totalRenters,
    ageDistribution,
    genderRatio,
    educationDistribution,
    occupationDistribution,
    dwellingStatus: dwellingCounts,
    complaintsByCategory,
  };

  const financeSummary: PublicFinanceSummary = {
    saldoAwal,
    pemasukan,
    pengeluaran,
    saldoAkhir,
  };

  const emergencyContacts: EmergencyContactItem[] = settings.emergencyContacts || [];

  return {
    settings,
    announcements,
    activities,
    demographics,
    financeSummary,
    emergencyContacts,
  };
}

export interface GetPaginatedAnnouncementsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export async function getPaginatedPublicAnnouncements({
  page = 1,
  limit = 6,
  category,
  search,
}: GetPaginatedAnnouncementsParams) {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (category && category !== "semua") {
    conditions.push(eq(schema.announcements.category, category as any));
  }

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    conditions.push(
      or(
        like(schema.announcements.title, searchPattern),
        like(schema.announcements.content, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query total count
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.announcements)
    .where(whereClause);

  const totalItems = totalRes?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Query paginated items
  const rawItems = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
      creatorName: schema.users.name,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.createdAt))
    .limit(limit)
    .offset(offset);

  const data: PublicAnnouncementItem[] = rawItems.map((a) => ({
    ...a,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export interface GetPaginatedActivitiesParams {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
}

export async function getPaginatedPublicActivities({
  page = 1,
  limit = 6,
  filter = "semua",
  search,
}: GetPaginatedActivitiesParams) {
  const offset = (page - 1) * limit;
  const now = new Date();
  const conditions = [];

  if (filter === "mendatang") {
    conditions.push(gte(schema.activities.eventDate, now));
  } else if (filter === "selesai") {
    conditions.push(sql`${schema.activities.eventDate} < ${now}`);
  }

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    conditions.push(
      or(
        like(schema.activities.title, searchPattern),
        like(schema.activities.description, searchPattern),
        like(schema.activities.location, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query total count
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activities)
    .where(whereClause);

  const totalItems = totalRes?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Query paginated items
  const rawItems = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
      createdAt: schema.activities.createdAt,
    })
    .from(schema.activities)
    .where(whereClause)
    .orderBy(desc(schema.activities.isPinned), schema.activities.eventDate)
    .limit(limit)
    .offset(offset);

  const data: PublicActivityItem[] = rawItems.map((a) => ({
    ...a,
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export interface PublicFinanceTransactionItem {
  id: number;
  type: "income" | "expense";
  amount: number;
  transactionDate: string;
  category: string;
  description: string | null;
  createdAt: string;
}

export interface GetPaginatedFinanceParams {
  page?: number;
  limit?: number;
  type?: string;
  month?: string; // e.g. "2026-07" or "semua"
  search?: string;
}

export async function getPaginatedPublicFinanceTransactions({
  page = 1,
  limit = 8,
  type = "semua",
  month = "semua",
  search,
}: GetPaginatedFinanceParams) {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(schema.cashTransactions.status, "approved")];

  if (type === "masuk") {
    conditions.push(eq(schema.cashTransactions.type, "income"));
  } else if (type === "keluar") {
    conditions.push(eq(schema.cashTransactions.type, "expense"));
  }

  if (month && month !== "semua") {
    const [yearStr, monthStr] = month.split("-");
    if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const startDate = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
      const lastDay = new Date(year, m, 0).getDate();
      const endDate = `${yearStr}-${monthStr.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;
      conditions.push(
        sql`${schema.cashTransactions.transactionDate} >= ${startDate} AND ${schema.cashTransactions.transactionDate} <= ${endDate}`
      );
    }
  }

  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    conditions.push(
      sql`(${schema.cashTransactions.category} LIKE ${searchPattern} OR ${schema.cashTransactions.description} LIKE ${searchPattern})`
    );
  }

  const whereClause = and(...conditions);

  // Query total count
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(whereClause);

  const totalItems = totalRes?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Query paginated items
  const rawItems = await db
    .select({
      id: schema.cashTransactions.id,
      type: schema.cashTransactions.type,
      amount: schema.cashTransactions.amount,
      transactionDate: schema.cashTransactions.transactionDate,
      category: schema.cashTransactions.category,
      description: schema.cashTransactions.description,
      createdAt: schema.cashTransactions.createdAt,
    })
    .from(schema.cashTransactions)
    .where(whereClause)
    .orderBy(desc(schema.cashTransactions.transactionDate), desc(schema.cashTransactions.id))
    .limit(limit)
    .offset(offset);

  const data: PublicFinanceTransactionItem[] = rawItems.map((t) => ({
    ...t,
    amount: Number(t.amount) || 0,
    transactionDate: typeof t.transactionDate === "string" ? t.transactionDate : new Date(t.transactionDate).toISOString().split("T")[0],
    createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
  }));

  // Overall Financial Summary
  const [incomeSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "income"), eq(schema.cashTransactions.status, "approved")));

  const [expenseSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "expense"), eq(schema.cashTransactions.status, "approved")));

  const [feePaidSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.feePayments.amountPaid}), 0)`.mapWith(Number) })
    .from(schema.feePayments);

  const totalPemasukan = (incomeSum?.total || 0) + (feePaidSum?.total || 0);
  const totalPengeluaran = expenseSum?.total || 0;
  const totalSaldo = totalPemasukan - totalPengeluaran;

  return {
    data,
    summary: {
      totalSaldo,
      totalPemasukan,
      totalPengeluaran,
    },
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export interface PublicScanResultData {
  id: number;
  blockNumber: string;
  houseNumber: string;
  qrToken: string;
  type: "permanen" | "kos" | "homestay";
  latitude: string | null;
  longitude: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  propertyName: string | null;
  totalRooms: number | null;
  occupiedRooms: number;
  availableRooms: number | null;
  rtName: string;
  rwName: string;
  villageName: string;
}

export async function getPublicScanDwelling(token: string): Promise<PublicScanResultData | null> {
  if (!token || !token.trim()) return null;
  const cleanedToken = token.trim();

  let blockMatch: string | null = null;
  let houseMatch: string | null = null;

  const addressRegex = /(?:blok\s*)?([a-z0-9]+)[\s\-\/\,]+(?:no\.?\s*)?([a-z0-9]+)/i;
  const matchResult = cleanedToken.match(addressRegex);
  if (matchResult && matchResult[1] && matchResult[2]) {
    blockMatch = matchResult[1].trim();
    houseMatch = matchResult[2].trim();
  }

  const conditions: SQL<unknown>[] = [
    eq(schema.dwellings.qrToken, cleanedToken),
    like(schema.dwellings.qrToken, `%${cleanedToken}%`),
  ];

  if (blockMatch && houseMatch) {
    conditions.push(
      and(
        eq(schema.dwellings.blockNumber, blockMatch),
        eq(schema.dwellings.houseNumber, houseMatch)
      ) as SQL<unknown>
    );
    conditions.push(
      and(
        like(schema.dwellings.blockNumber, `%${blockMatch}%`),
        like(schema.dwellings.houseNumber, `%${houseMatch}%`)
      ) as SQL<unknown>
    );
  }

  const numId = parseInt(cleanedToken, 10);
  if (!isNaN(numId) && numId > 0) {
    conditions.push(eq(schema.dwellings.id, numId));
  }

  const whereClause = or(...conditions) as SQL<unknown>;

  const [dwelling] = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      qrToken: schema.dwellings.qrToken,
      type: schema.dwellings.type,
      latitude: schema.dwellings.latitude,
      longitude: schema.dwellings.longitude,
      ownerUserId: schema.dwellings.ownerUserId,
      ownerName: schema.dwellings.ownerName,
      ownerPhone: schema.dwellings.ownerPhone,
    })
    .from(schema.dwellings)
    .where(whereClause)
    .limit(1);

  if (!dwelling) return null;

  // System settings for RT/RW info
  const settings = await getSystemSettings();

  let propertyName: string | null = null;
  let totalRooms: number | null = null;
  let occupiedRooms = 0;
  let ownerName = dwelling.ownerName || null;
  let ownerPhone = dwelling.ownerPhone || null;

  if (dwelling.type === "kos") {
    // Ambil rental_property aktif dari dwelling ini (data akurat)
    const [rentalProp] = await db
      .select({
        id: schema.rentalProperties.id,
        name: schema.rentalProperties.name,
        totalRooms: schema.rentalProperties.totalRooms,
        contactPerson: schema.rentalProperties.contactPerson,
        phone: schema.rentalProperties.phone,
      })
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, dwelling.id),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (rentalProp) {
      propertyName = rentalProp.name;
      totalRooms = rentalProp.totalRooms || 0;
      if (rentalProp.contactPerson) ownerName = rentalProp.contactPerson;
      if (rentalProp.phone) ownerPhone = rentalProp.phone;

      // Hitung penghuni aktif dari tabel residents (bukan families)
      const [occupiedCount] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.residents)
        .where(
          and(
            eq(schema.residents.rentalPropertyId, rentalProp.id),
            eq(schema.residents.isActive, true),
            sql`${schema.residents.checkOutDate} IS NULL`
          )
        );
      occupiedRooms = occupiedCount?.count || 0;
    }
  } else if (dwelling.type === "homestay") {
    // Ambil nama properti homestay dari rental_properties jika ada
    const [rentalProp] = await db
      .select({
        name: schema.rentalProperties.name,
        contactPerson: schema.rentalProperties.contactPerson,
        phone: schema.rentalProperties.phone,
      })
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, dwelling.id),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (rentalProp) {
      propertyName = rentalProp.name;
      if (rentalProp.contactPerson) ownerName = rentalProp.contactPerson;
      if (rentalProp.phone) ownerPhone = rentalProp.phone;
    } else {
      propertyName = `Homestay Blok ${dwelling.blockNumber} No. ${dwelling.houseNumber}`;
    }
  }

  const availableRooms = totalRooms !== null ? Math.max(0, totalRooms - occupiedRooms) : null;

  return {
    id: dwelling.id,
    blockNumber: dwelling.blockNumber,
    houseNumber: dwelling.houseNumber,
    qrToken: dwelling.qrToken,
    type: dwelling.type,
    latitude: dwelling.latitude ? String(dwelling.latitude) : null,
    longitude: dwelling.longitude ? String(dwelling.longitude) : null,
    ownerName,
    ownerPhone,
    propertyName,
    totalRooms,
    occupiedRooms,
    availableRooms,
    rtName: settings?.rtName || "RT -",
    rwName: settings?.rwName || "RW -",
    villageName: settings?.villageName || "-",
  };
}

// ─── OWNERSHIP CHECK ────────────────────────────────────────────────────────

export type ScanOwnershipStatus =
  | "warga-permanen"
  | "koordinator-kos"
  | "pemilik-homestay"
  | "non-owner";

export interface ScanOwnershipResult {
  ownershipStatus: ScanOwnershipStatus;
  redirectTarget: string | null;
  propertyId: number | null;
  dwellingId: number | null;
}

/**
 * Mengecek apakah user yang login adalah pemilik/koordinator dari dwelling yang di-scan.
 */
export async function checkDwellingOwnership(
  token: string,
  userId: string
): Promise<ScanOwnershipResult> {
  if (!token || !userId) {
    return { ownershipStatus: "non-owner", redirectTarget: null, propertyId: null, dwellingId: null };
  }

  const cleanedToken = token.trim();
  const conds: SQL<unknown>[] = [
    eq(schema.dwellings.qrToken, cleanedToken),
    like(schema.dwellings.qrToken, `%${cleanedToken}%`),
  ];

  const addrRegex = /(?:blok\s*)?([a-z0-9]+)[\s\-\/\,]+(?:no\.?\s*)?([a-z0-9]+)/i;
  const addrMatch = cleanedToken.match(addrRegex);
  if (addrMatch?.[1] && addrMatch?.[2]) {
    conds.push(
      and(
        eq(schema.dwellings.blockNumber, addrMatch[1].trim()),
        eq(schema.dwellings.houseNumber, addrMatch[2].trim())
      ) as SQL<unknown>
    );
  }

  const numId = parseInt(cleanedToken, 10);
  if (!isNaN(numId) && numId > 0) {
    conds.push(eq(schema.dwellings.id, numId));
  }

  const [dwelling] = await db
    .select({
      id: schema.dwellings.id,
      type: schema.dwellings.type,
      ownerUserId: schema.dwellings.ownerUserId,
    })
    .from(schema.dwellings)
    .where(or(...conds) as SQL<unknown>)
    .limit(1);

  if (!dwelling) {
    return { ownershipStatus: "non-owner", redirectTarget: null, propertyId: null, dwellingId: null };
  }

  // 1. Cek warga permanen: headUserId di families aktif
  if (dwelling.type === "permanen") {
    const [familyMatch] = await db
      .select({ id: schema.families.id })
      .from(schema.families)
      .where(
        and(
          eq(schema.families.dwellingId, dwelling.id),
          eq(schema.families.headUserId, userId),
          eq(schema.families.isActive, true)
        )
      )
      .limit(1);

    if (familyMatch) {
      return {
        ownershipStatus: "warga-permanen",
        redirectTarget: "/dashboard",
        propertyId: null,
        dwellingId: dwelling.id,
      };
    }
  }

  // 2. Cek koordinator kos: coordinatorUserId di rental_properties aktif
  if (dwelling.type === "kos") {
    const [rentalMatch] = await db
      .select({ id: schema.rentalProperties.id })
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, dwelling.id),
          eq(schema.rentalProperties.coordinatorUserId, userId),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (rentalMatch) {
      return {
        ownershipStatus: "koordinator-kos",
        redirectTarget: `/dashboard/rentals?propertyId=${rentalMatch.id}`,
        propertyId: rentalMatch.id,
        dwellingId: dwelling.id,
      };
    }
  }

  // 3. Cek pemilik homestay: ownerUserId di dwellings
  if (dwelling.type === "homestay" && dwelling.ownerUserId === userId) {
    return {
      ownershipStatus: "pemilik-homestay",
      redirectTarget: `/dashboard/my-properties?dwellingId=${dwelling.id}`,
      propertyId: null,
      dwellingId: dwelling.id,
    };
  }

  return {
    ownershipStatus: "non-owner",
    redirectTarget: null,
    propertyId: null,
    dwellingId: dwelling.id,
  };
}

// ─── DETAILED SCAN DATA (untuk user login non-pemilik) ─────────────────────

export interface ActiveResidentEntry {
  type: "keluarga" | "penyewa";
  name: string;
  memberCount?: number;
  roomNumber?: string | null;
  unitNumber?: string | null;
  checkInDate: string | null;
}

export interface DetailedScanResultData {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: "permanen" | "kos" | "homestay";
  latitude: string | null;
  longitude: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  propertyName: string | null;
  totalRooms: number | null;
  occupiedRooms: number;
  availableRooms: number | null;
  activeResidents: ActiveResidentEntry[];
  rtName: string;
  rwName: string;
  villageName: string;
}

/**
 * Mengambil data detail hunian untuk user yang login (bukan pemilik/koordinator).
 * Menampilkan daftar penghuni aktif per unit/kamar.
 */
export async function getDetailedScanDwelling(token: string): Promise<DetailedScanResultData | null> {
  const publicData = await getPublicScanDwelling(token);
  if (!publicData) return null;

  const settings = await getSystemSettings();
  const activeResidents: ActiveResidentEntry[] = [];

  // Ambil KK aktif di dwelling ini
  const activeFamilies = await db
    .select({
      id: schema.families.id,
      headName: schema.families.headName,
      unitNumber: schema.families.unitNumber,
      checkInDate: schema.families.checkInDate,
    })
    .from(schema.families)
    .where(
      and(
        eq(schema.families.dwellingId, publicData.id),
        eq(schema.families.isActive, true)
      )
    );

  for (const family of activeFamilies) {
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.familyId, family.id),
          eq(schema.residents.isActive, true)
        )
      );

    activeResidents.push({
      type: "keluarga",
      name: family.headName,
      memberCount: memberCount?.count || 1,
      unitNumber: family.unitNumber || null,
      checkInDate: family.checkInDate ? String(family.checkInDate) : null,
    });
  }

  // Untuk kos/homestay: ambil penyewa aktif perorangan
  if (publicData.type === "kos" || publicData.type === "homestay") {
    const activeTenants = await db
      .select({
        name: schema.residents.name,
        roomNumber: schema.residents.roomNumber,
        checkInDate: schema.residents.checkInDate,
      })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.dwellingId, publicData.id),
          eq(schema.residents.isActive, true),
          sql`${schema.residents.checkOutDate} IS NULL`,
          sql`${schema.residents.familyId} IS NULL`
        )
      );

    for (const tenant of activeTenants) {
      activeResidents.push({
        type: "penyewa",
        name: tenant.name,
        roomNumber: tenant.roomNumber || null,
        checkInDate: tenant.checkInDate ? String(tenant.checkInDate) : null,
      });
    }
  }

  return {
    id: publicData.id,
    blockNumber: publicData.blockNumber,
    houseNumber: publicData.houseNumber,
    type: publicData.type,
    latitude: publicData.latitude,
    longitude: publicData.longitude,
    ownerName: publicData.ownerName,
    ownerPhone: publicData.ownerPhone,
    propertyName: publicData.propertyName,
    totalRooms: publicData.totalRooms,
    occupiedRooms: publicData.occupiedRooms,
    availableRooms: publicData.availableRooms,
    activeResidents,
    rtName: settings?.rtName || "RT -",
    rwName: settings?.rwName || "RW -",
    villageName: settings?.villageName || "-",
  };
}
