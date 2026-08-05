import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, sql, desc, or, like, gte, lt, lte } from 'drizzle-orm';
import { startOfMonth } from 'date-fns';

// ==========================================
// TYPE DEFINITIONS FOR PUBLIC PORTAL
// ==========================================

export interface PublicAnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: 'umum' | 'penting' | 'mendesak';
  attachments?: string | null;
  isPinned: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  creatorName?: string | null;
}

export interface PublicActivityItem {
  id: number;
  title: string;
  description?: string | null;
  eventDate: Date | string;
  location?: string | null;
  attachments?: string | null;
  isPinned: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DemographicDistributionItem {
  category: string;
  label: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface PublicDemographicsData {
  totalFamilies: number;
  totalMembers: number;
  totalTenants: number;
  totalDwellings: number;
  totalHouses: number;
  totalResidents: number;
  totalRenters: number;
  genderStats: { male: number; female: number };
  genderRatio: { male: number; female: number; malePct: number; femalePct: number };
  ageDistribution: DemographicDistributionItem[];
  educationDistribution: DemographicDistributionItem[];
  occupationDistribution: DemographicDistributionItem[];
  dwellingStatus: { terisi: number; kos: number; kosong: number };
  complaintsByCategory: DemographicDistributionItem[];
}

export interface PublicFinanceSummary {
  totalBalance: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  saldoAwal: number;
  pemasukan: number;
  pengeluaran: number;
  saldoAkhir: number;
}

export interface EmergencyContactItem {
  id?: string;
  name: string;
  phone: string;
  subtitle?: string;
}

export interface PublicScanResultData {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  propertyName?: string | null;
  totalRooms?: number | null;
  occupiedRooms?: number | null;
  availableRooms?: number | null;
  rtName?: string | null;
  rwName?: string | null;
  villageName?: string | null;
}

export interface ActiveResidentEntry {
  id: number;
  name: string;
  type?: string | null;
  memberCount?: number | null;
  unitNumber?: string | null;
  roomNumber?: string | null;
  checkInDate?: string | Date | null;
}

export interface DetailedScanResultData {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  propertyName?: string | null;
  totalRooms?: number | null;
  occupiedRooms?: number | null;
  availableRooms?: number | null;
  activeResidents?: ActiveResidentEntry[];
  rtName?: string | null;
  rwName?: string | null;
  villageName?: string | null;
}

export interface PublicFinanceTransactionItem {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  transactionDate: Date | string;
}

// ==========================================
// PUBLIC PORTAL QUERIES
// ==========================================

export async function getPublicRtInfo() {
  const [settings] = await db
    .select({
      rtName: schema.systemSettings.rtName,
      rwName: schema.systemSettings.rwName,
      villageName: schema.systemSettings.villageName,
      subdistrict: schema.systemSettings.subdistrict,
      city: schema.systemSettings.city,
      logoPath: schema.systemSettings.logoPath,
      officialEmail: schema.systemSettings.officialEmail,
      officialRtPhone: schema.systemSettings.officialRtPhone,
      officialSecretaryPhone: schema.systemSettings.officialSecretaryPhone,
      officialTreasurerPhone: schema.systemSettings.officialTreasurerPhone,
      emergencyContacts: schema.systemSettings.emergencyContacts,
      latitude: schema.systemSettings.latitude,
      longitude: schema.systemSettings.longitude,
      secretariatAddress: schema.systemSettings.secretariatAddress,
    })
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1))
    .limit(1);

  return settings ?? null;
}

export async function getPublicAnnouncements(limit = 10): Promise<PublicAnnouncementItem[]> {
  return db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      attachments: schema.announcements.attachments,
      isPinned: schema.announcements.isPinned,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
      updatedAt: schema.announcements.updatedAt,
      creatorName: schema.users.name,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .orderBy(schema.announcements.isPinned, schema.announcements.publishedAt)
    .limit(limit);
}

export async function getPaginatedPublicAnnouncements(options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 6);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (options.category && options.category !== 'semua') {
    conditions.push(eq(schema.announcements.category, options.category as any));
  }

  if (options.search && options.search.trim() !== '') {
    const q = `%${options.search.trim()}%`;
    conditions.push(or(like(schema.announcements.title, q), like(schema.announcements.content, q)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totalRes], items] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.announcements).where(whereClause),
    db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        content: schema.announcements.content,
        category: schema.announcements.category,
        attachments: schema.announcements.attachments,
        isPinned: schema.announcements.isPinned,
        publishedAt: schema.announcements.publishedAt,
        createdAt: schema.announcements.createdAt,
        updatedAt: schema.announcements.updatedAt,
        creatorName: schema.users.name,
      })
      .from(schema.announcements)
      .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt), desc(schema.announcements.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const totalItems = totalRes?.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasMore = page < totalPages;

  return {
    data: items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore,
    },
  };
}

export async function getPublicActivities(limit = 10): Promise<PublicActivityItem[]> {
  return db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      attachments: schema.activities.attachments,
      isPinned: schema.activities.isPinned,
      createdAt: schema.activities.createdAt,
      updatedAt: schema.activities.updatedAt,
    })
    .from(schema.activities)
    .orderBy(schema.activities.isPinned, schema.activities.eventDate)
    .limit(limit);
}

export async function getPaginatedPublicActivities(options: {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 6);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  const now = new Date();

  if (options.filter === 'mendatang') {
    conditions.push(gte(schema.activities.eventDate, now));
  } else if (options.filter === 'selesai') {
    conditions.push(lt(schema.activities.eventDate, now));
  }

  if (options.search && options.search.trim() !== '') {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(schema.activities.title, q),
        like(schema.activities.location, q),
        like(schema.activities.description, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totalRes], items] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.activities).where(whereClause),
    db
      .select({
        id: schema.activities.id,
        title: schema.activities.title,
        description: schema.activities.description,
        eventDate: schema.activities.eventDate,
        location: schema.activities.location,
        attachments: schema.activities.attachments,
        isPinned: schema.activities.isPinned,
        createdAt: schema.activities.createdAt,
        updatedAt: schema.activities.updatedAt,
      })
      .from(schema.activities)
      .where(whereClause)
      .orderBy(desc(schema.activities.isPinned), desc(schema.activities.eventDate))
      .limit(limit)
      .offset(offset),
  ]);

  const totalItems = totalRes?.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasMore = page < totalPages;

  return {
    data: items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore,
    },
  };
}

export async function getPaginatedPublicFinanceTransactions(options: {
  page?: number;
  limit?: number;
  type?: string;
  month?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, options.limit ?? 8);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (options.type === 'masuk') {
    conditions.push(eq(schema.cashTransactions.type, 'income'));
  } else if (options.type === 'keluar') {
    conditions.push(eq(schema.cashTransactions.type, 'expense'));
  }

  if (options.month && options.month !== 'semua') {
    const [yearStr, monthStr] = options.month.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!isNaN(year) && !isNaN(month)) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      conditions.push(
        and(
          gte(schema.cashTransactions.transactionDate, startDate),
          lte(schema.cashTransactions.transactionDate, endDate)
        )
      );
    }
  }

  if (options.search && options.search.trim() !== '') {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(schema.cashTransactions.category, q),
        like(schema.cashTransactions.description, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totalRes], [summaryRes], items] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.cashTransactions).where(whereClause),
    db.select({
      totalInc: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExp: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    }).from(schema.cashTransactions),
    db
      .select({
        id: schema.cashTransactions.id,
        type: schema.cashTransactions.type,
        amount: schema.cashTransactions.amount,
        transactionDate: schema.cashTransactions.transactionDate,
        category: schema.cashTransactions.category,
        description: schema.cashTransactions.description,
      })
      .from(schema.cashTransactions)
      .where(whereClause)
      .orderBy(desc(schema.cashTransactions.transactionDate))
      .limit(limit)
      .offset(offset),
  ]);

  const totalItems = totalRes?.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasMore = page < totalPages;

  const inc = summaryRes?.totalInc ?? 0;
  const exp = summaryRes?.totalExp ?? 0;

  return {
    data: items.map((i) => ({ ...i, amount: Number(i.amount) })),
    summary: {
      totalSaldo: inc - exp,
      totalPemasukan: inc,
      totalPengeluaran: exp,
    },
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore,
    },
  };
}

export async function getPublicDemographicsData(): Promise<PublicDemographicsData> {
  const [
    [totalFam],
    [totalMem],
    [totalTen],
    [totalDwell],
    [genderStatsRes],
    [ageStatsRes],
    [dwellingTypesRes],
    eduGroupRes,
    occGroupRes,
    complaintsGroupRes,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.families)
      .where(and(eq(schema.families.isActive, true), eq(schema.families.verificationStatus, 'verified'))),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.rentalContracts)
      .where(eq(schema.rentalContracts.isActive, true)),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.isActive, true)),

    db.select({
      male: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.gender} = 'L' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      female: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.gender} = 'P' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    db.select({
      anak: sql<number>`COALESCE(SUM(CASE WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) < 18 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      dewasa: sql<number>`COALESCE(SUM(CASE WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 18 AND 59 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      lansia: sql<number>`COALESCE(SUM(CASE WHEN TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) >= 60 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    db.select({
      permanen: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dwellings.type} = 'permanen' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      kos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.dwellings.type} = 'kos' OR ${schema.dwellings.type} = 'homestay' THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.isActive, true)),

    db.select({
      educationLevel: schema.familyMembers.educationLevel,
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true))
      .groupBy(schema.familyMembers.educationLevel),

    db.select({
      occupation: schema.familyMembers.occupation,
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true))
      .groupBy(schema.familyMembers.occupation),

    db.select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.complaints)
      .groupBy(schema.complaints.category),
  ]);

  const totalM = genderStatsRes?.male ?? 0;
  const totalF = genderStatsRes?.female ?? 0;
  const totalG = totalM + totalF || 1;

  const totalFams = totalFam?.count ?? 0;
  const totalMems = totalMem?.count ?? 0;
  const totalTens = totalTen?.count ?? 0;
  const totalDwells = totalDwell?.count ?? 0;

  const anakCount = ageStatsRes?.anak ?? 0;
  const dewasaCount = ageStatsRes?.dewasa ?? 0;
  const lansiaCount = ageStatsRes?.lansia ?? 0;
  const totalAgeCount = anakCount + dewasaCount + lansiaCount || 1;

  const ageDistribution: DemographicDistributionItem[] = [
    { category: 'Anak (0-17)', label: 'Anak (0-17)', count: anakCount, percentage: Math.round((anakCount / totalAgeCount) * 100), color: '#2563eb' },
    { category: 'Dewasa (18-59)', label: 'Dewasa (18-59)', count: dewasaCount, percentage: Math.round((dewasaCount / totalAgeCount) * 100), color: '#10b981' },
    { category: 'Lansia (60+)', label: 'Lansia (60+)', count: lansiaCount, percentage: Math.round((lansiaCount / totalAgeCount) * 100), color: '#f97316' },
  ];

  const safeTotalMems = totalMems || 1;
  const educationColorMap: Record<string, string> = {
    'SD / SMP': '#8b5cf6',
    'SMA / SMK': '#ec4899',
    'Diploma / Sarjana': '#06b6d4',
    'SD': '#8b5cf6',
    'SMP': '#a855f7',
    'SMA': '#ec4899',
    'SMK': '#f43f5e',
    'D3': '#0ea5e9',
    'S1': '#06b6d4',
    'S2': '#14b8a6',
    'S3': '#10b981',
  };

  const educationDistribution: DemographicDistributionItem[] = eduGroupRes.length > 0
    ? eduGroupRes.map((item) => {
        const label = item.educationLevel || 'Lainnya';
        return {
          category: label,
          label,
          count: item.count,
          percentage: Math.round((item.count / safeTotalMems) * 100),
          color: educationColorMap[label] || '#64748b',
        };
      })
    : [
        { category: 'SD / SMP', label: 'SD / SMP', count: 0, percentage: 0, color: '#8b5cf6' },
        { category: 'SMA / SMK', label: 'SMA / SMK', count: 0, percentage: 0, color: '#ec4899' },
        { category: 'Diploma / Sarjana', label: 'Diploma / Sarjana', count: 0, percentage: 0, color: '#06b6d4' },
      ];

  const occupationColorMap: Record<string, string> = {
    'Karyawan Swasta': '#2563eb',
    'Wiraswasta': '#10b981',
    'PNS / BUMN': '#f97316',
    'Lainnya': '#8b5cf6',
  };

  const occupationDistribution: DemographicDistributionItem[] = occGroupRes.length > 0
    ? occGroupRes.map((item) => {
        const label = item.occupation || 'Lainnya';
        return {
          category: label,
          label,
          count: item.count,
          percentage: Math.round((item.count / safeTotalMems) * 100),
          color: occupationColorMap[label] || '#64748b',
        };
      })
    : [
        { category: 'Karyawan Swasta', label: 'Karyawan Swasta', count: 0, percentage: 0, color: '#2563eb' },
        { category: 'Wiraswasta', label: 'Wiraswasta', count: 0, percentage: 0, color: '#10b981' },
        { category: 'PNS / BUMN', label: 'PNS / BUMN', count: 0, percentage: 0, color: '#f97316' },
        { category: 'Lainnya', label: 'Lainnya', count: 0, percentage: 0, color: '#8b5cf6' },
      ];

  const totalComplaints = complaintsGroupRes.reduce((sum, item) => sum + item.count, 0) || 1;
  const complaintColorMap: Record<string, string> = {
    'Infrastruktur': '#f43f5e',
    'Kebersihan': '#10b981',
    'Keamanan': '#eab308',
    'Sosial': '#8b5cf6',
    'Lainnya': '#64748b',
  };

  const complaintsByCategory: DemographicDistributionItem[] = complaintsGroupRes.length > 0
    ? complaintsGroupRes.map((item) => ({
        category: item.category,
        label: item.category,
        count: item.count,
        percentage: Math.round((item.count / totalComplaints) * 100),
        color: complaintColorMap[item.category] || '#64748b',
      }))
    : [
        { category: 'Fasilitas Umum', label: 'Fasilitas Umum', count: 0, percentage: 0, color: '#f43f5e' },
        { category: 'Keamanan', label: 'Keamanan', count: 0, percentage: 0, color: '#eab308' },
        { category: 'Kebersihan', label: 'Kebersihan', count: 0, percentage: 0, color: '#10b981' },
      ];

  const totalPermanen = dwellingTypesRes?.permanen ?? 0;
  const totalKos = dwellingTypesRes?.kos ?? 0;
  const totalKosong = Math.max(0, totalDwells - totalPermanen - totalKos);

  return {
    totalFamilies: totalFams,
    totalMembers: totalMems,
    totalTenants: totalTens,
    totalDwellings: totalDwells,
    totalHouses: totalDwells,
    totalResidents: totalMems,
    totalRenters: totalTens,
    genderStats: { male: totalM, female: totalF },
    genderRatio: {
      male: totalM,
      female: totalF,
      malePct: Math.round((totalM / totalG) * 100),
      femalePct: Math.round((totalF / totalG) * 100),
    },
    ageDistribution,
    educationDistribution,
    occupationDistribution,
    dwellingStatus: {
      terisi: totalPermanen,
      kos: totalKos,
      kosong: totalKosong,
    },
    complaintsByCategory,
  };
}

export async function getPublicFinanceSummary(): Promise<PublicFinanceSummary> {
  const startOfCurrentMonth = startOfMonth(new Date());

  const [res] = await db
    .select({
      totalInc: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      totalExp: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      incMonth: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'income' AND ${schema.cashTransactions.transactionDate} >= ${startOfCurrentMonth} THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
      expMonth: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashTransactions.type} = 'expense' AND ${schema.cashTransactions.transactionDate} >= ${startOfCurrentMonth} THEN ${schema.cashTransactions.amount} ELSE 0 END), 0)`.mapWith(Number),
    })
    .from(schema.cashTransactions);

  const totalB = (res?.totalInc ?? 0) - (res?.totalExp ?? 0);
  const incM = res?.incMonth ?? 0;
  const expM = res?.expMonth ?? 0;

  return {
    totalBalance: totalB,
    incomeThisMonth: incM,
    expenseThisMonth: expM,
    saldoAwal: totalB - (incM - expM),
    pemasukan: incM,
    pengeluaran: expM,
    saldoAkhir: totalB,
  };
}

export async function getPublicPortalData() {
  const [settings, announcements, activities, demographics, financeSummary] = await Promise.all([
    getPublicRtInfo(),
    getPublicAnnouncements(10),
    getPublicActivities(10),
    getPublicDemographicsData(),
    getPublicFinanceSummary(),
  ]);

  return {
    settings,
    announcements,
    activities,
    demographics,
    financeSummary,
    emergencyContacts: settings?.emergencyContacts || [],
  };
}

export async function resolveDwellingByTokenOrNumber(tokenStr: string) {
  if (!tokenStr || !tokenStr.trim()) return null;
  const clean = tokenStr.trim();

  // 1. Match exact QR Token
  let [dwelling] = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      type: schema.dwellings.type,
      isActive: schema.dwellings.isActive,
      ownerUserId: schema.dwellings.ownerUserId,
      latitude: schema.dwellings.latitude,
      longitude: schema.dwellings.longitude,
      notes: schema.dwellings.notes,
    })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.qrToken, clean))
    .limit(1);

  if (dwelling) return dwelling;

  // 2. Match numeric ID
  if (/^\d+$/.test(clean)) {
    [dwelling] = await db
      .select({
        id: schema.dwellings.id,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        type: schema.dwellings.type,
        isActive: schema.dwellings.isActive,
        ownerUserId: schema.dwellings.ownerUserId,
        latitude: schema.dwellings.latitude,
        longitude: schema.dwellings.longitude,
        notes: schema.dwellings.notes,
      })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, parseInt(clean, 10)))
      .limit(1);

    if (dwelling) return dwelling;
  }

  // 3. Match block & house number pattern (e.g. "A1-12", "Blok A1 No 12", "A1/12")
  const normalized = clean.replace(/blok|no\.?|/gi, '').trim();
  const parts = normalized.split(/[-/\s]+/).filter(Boolean);

  if (parts.length >= 2) {
    const blockNum = parts[0].toUpperCase();
    const houseNum = parts[1];

    [dwelling] = await db
      .select({
        id: schema.dwellings.id,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        type: schema.dwellings.type,
        isActive: schema.dwellings.isActive,
        ownerUserId: schema.dwellings.ownerUserId,
        latitude: schema.dwellings.latitude,
        longitude: schema.dwellings.longitude,
        notes: schema.dwellings.notes,
      })
      .from(schema.dwellings)
      .where(and(eq(schema.dwellings.blockNumber, blockNum), eq(schema.dwellings.houseNumber, houseNum)))
      .limit(1);

    if (dwelling) return dwelling;
  }

  return null;
}

export async function validateDwellingQrToken(qrToken: string) {
  return resolveDwellingByTokenOrNumber(qrToken);
}

export async function getPublicScanDwelling(tokenStr: string) {
  return resolveDwellingByTokenOrNumber(tokenStr);
}

export async function getDetailedScanDwelling(tokenStr: string | number) {
  return resolveDwellingByTokenOrNumber(String(tokenStr));
}

export async function checkDwellingOwnership(tokenStr: string | number, userId: string) {
  const dwelling = await resolveDwellingByTokenOrNumber(String(tokenStr));
  if (!dwelling) {
    return {
      ownershipStatus: 'non-owner',
      redirectTarget: null,
      propertyId: null,
      dwellingId: null,
    };
  }

  if (dwelling.ownerUserId === userId) {
    return {
      ownershipStatus: dwelling.type === 'permanen' ? 'warga-permanen' : 'koordinator-kos',
      redirectTarget: dwelling.type === 'permanen' ? '/dashboard' : '/dashboard/properties',
      dwellingId: dwelling.id,
    };
  }

  return {
    ownershipStatus: 'non-owner',
    redirectTarget: null,
    dwellingId: dwelling.id,
  };
}
