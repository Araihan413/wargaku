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
  isUpcoming?: boolean;
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
  ktpDistribution?: {
    villageName: string;
    totalLocal: number;
    totalNonLocal: number;
    localPercentage: number;
    nonLocalPercentage: number;
    total: number;
    nonLocalBreakdown?: {
      individualKos: number;
      familyRenters: number;
      permanentResidents: number;
    };
  };
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
  activeKkCount?: number;
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
  const now = new Date();
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
      isUpcoming: sql<boolean>`${schema.activities.eventDate} >= ${now}`.as('is_upcoming'),
    })
    .from(schema.activities)
    .orderBy(desc(schema.activities.isPinned), desc(schema.activities.eventDate))
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
    ktpMemStatsRes,
    ktpTenStatsRes,
    sysSettingsRes,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.families)
      .where(eq(schema.families.isActive, true)),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.rentalContracts)
      .where(and(eq(schema.rentalContracts.isActive, true), eq(schema.rentalContracts.tenantType, 'individual'))),

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
      anak: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) < 12 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      remaja: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 12 AND 17 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      dewasa: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) BETWEEN 18 AND 59 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      lansia: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NOT NULL AND TIMESTAMPDIFF(YEAR, ${schema.familyMembers.birthDate}, CURDATE()) >= 60 THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      belumTerdata: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.birthDate} IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true)),

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

    db.select({
      educationLevel: sql<string>`COALESCE(NULLIF(${schema.familyMembers.educationLevel}, ''), 'Belum Terdata')`.mapWith(String),
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true))
      .groupBy(sql`COALESCE(NULLIF(${schema.familyMembers.educationLevel}, ''), 'Belum Terdata')`),

    db.select({
      occupation: sql<string>`COALESCE(NULLIF(${schema.familyMembers.occupation}, ''), 'Belum Terdata')`.mapWith(String),
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true))
      .groupBy(sql`COALESCE(NULLIF(${schema.familyMembers.occupation}, ''), 'Belum Terdata')`),

    db.select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    })
      .from(schema.complaints)
      .groupBy(schema.complaints.category),

    // KTP Distribution - Family Members (dengan breakdown Warga Tetap vs Keluarga Pengontrak)
    db.select({
      local: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = TRUE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalPermanent: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = FALSE AND rc.id IS NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalFamilyRental: sql<number>`COALESCE(SUM(CASE WHEN ${schema.familyMembers.isKtpSameVillage} = FALSE AND rc.id IS NOT NULL THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.familyMembers)
      .leftJoin(
        sql`(SELECT DISTINCT family_id as id FROM rental_contracts WHERE is_active = 1 AND tenant_type = 'family' AND family_id IS NOT NULL) rc`,
        sql`${schema.familyMembers.familyId} = rc.id`
      )
      .where(eq(schema.familyMembers.isActive, true)),

    // KTP Distribution - Anak Kos Individu (Rental Contracts)
    db.select({
      local: sql<number>`COALESCE(SUM(CASE WHEN ${schema.rentalContracts.isKtpSameVillage} = TRUE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
      nonLocalIndividualKos: sql<number>`COALESCE(SUM(CASE WHEN ${schema.rentalContracts.isKtpSameVillage} = FALSE THEN 1 ELSE 0 END), 0)`.mapWith(Number),
    })
      .from(schema.rentalContracts)
      .where(and(
        eq(schema.rentalContracts.isActive, true),
        eq(schema.rentalContracts.tenantType, 'individual')
      )),

    // System Settings (Nama Kelurahan)
    db.select({ villageName: schema.systemSettings.villageName }).from(schema.systemSettings).limit(1),
  ]);

  const [ktpMemRes] = ktpMemStatsRes || [null];
  const [ktpTenRes] = ktpTenStatsRes || [null];
  const [sysSet] = sysSettingsRes || [null];

  const localMembers = ktpMemRes?.local ?? 0;
  const localTenants = ktpTenRes?.local ?? 0;
  const nonLocalIndividualKos = ktpTenRes?.nonLocalIndividualKos ?? 0;
  const nonLocalFamilyRental = ktpMemRes?.nonLocalFamilyRental ?? 0;
  const nonLocalPermanent = ktpMemRes?.nonLocalPermanent ?? 0;

  const totalLocalKtp = localMembers + localTenants;
  const totalNonLocalKtp = nonLocalIndividualKos + nonLocalFamilyRental + nonLocalPermanent;
  const totalKtpAnalyzed = totalLocalKtp + totalNonLocalKtp;

  const localPercentage = totalKtpAnalyzed > 0 ? Math.round((totalLocalKtp / totalKtpAnalyzed) * 100) : 0;
  const nonLocalPercentage = totalKtpAnalyzed > 0 ? (100 - localPercentage) : 0;

  const totalM = genderStatsRes?.male ?? 0;
  const totalF = genderStatsRes?.female ?? 0;
  const totalG = totalM + totalF || 1;

  const totalFams = totalFam?.count ?? 0;
  const totalMems = totalMem?.count ?? 0;
  const totalTens = totalTen?.count ?? 0;
  const totalDwells = totalDwell?.count ?? 0;

  const anakCount = ageStatsRes?.anak ?? 0;
  const remajaCount = ageStatsRes?.remaja ?? 0;
  const dewasaCount = ageStatsRes?.dewasa ?? 0;
  const lansiaCount = ageStatsRes?.lansia ?? 0;
  const belumTerdataAgeCount = ageStatsRes?.belumTerdata ?? 0;
  const totalAgeCount = anakCount + remajaCount + dewasaCount + lansiaCount + belumTerdataAgeCount || 1;

  const ageDistribution: DemographicDistributionItem[] = totalMems === 0
    ? []
    : [
        { category: 'Anak (0-11)', label: 'Anak (0-11 thn)', count: anakCount, percentage: Math.round((anakCount / totalAgeCount) * 100), color: '#2563eb' },
        { category: 'Remaja (12-17)', label: 'Remaja (12-17 thn)', count: remajaCount, percentage: Math.round((remajaCount / totalAgeCount) * 100), color: '#8b5cf6' },
        { category: 'Dewasa (18-59)', label: 'Dewasa (18-59 thn)', count: dewasaCount, percentage: Math.round((dewasaCount / totalAgeCount) * 100), color: '#10b981' },
        { category: 'Lansia (60+)', label: 'Lansia (60+ thn)', count: lansiaCount, percentage: Math.round((lansiaCount / totalAgeCount) * 100), color: '#f97316' },
        ...(belumTerdataAgeCount > 0 ? [{
          category: 'Belum Terdata',
          label: 'Belum Terdata',
          count: belumTerdataAgeCount,
          percentage: Math.round((belumTerdataAgeCount / totalAgeCount) * 100),
          color: '#94a3b8',
        }] : []),
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
    'Belum Terdata': '#94a3b8',
  };

  const educationDistribution: DemographicDistributionItem[] = eduGroupRes.length > 0
    ? eduGroupRes.map((item) => {
        const label = item.educationLevel || 'Belum Terdata';
        return {
          category: label,
          label,
          count: item.count,
          percentage: Math.round((item.count / safeTotalMems) * 100),
          color: educationColorMap[label] || '#64748b',
        };
      })
    : [];

  const occupationColorMap: Record<string, string> = {
    'Karyawan Swasta': '#2563eb',
    'Wiraswasta': '#10b981',
    'PNS / BUMN': '#f97316',
    'Pelajar / Mahasiswa': '#06b6d4',
    'Ibu Rumah Tangga': '#ec4899',
    'Belum / Tidak Bekerja': '#a855f7',
    'Lainnya': '#8b5cf6',
    'Belum Terdata': '#94a3b8',
  };

  const occupationDistribution: DemographicDistributionItem[] = occGroupRes.length > 0
    ? occGroupRes.map((item) => {
        const label = item.occupation || 'Belum Terdata';
        return {
          category: label,
          label,
          count: item.count,
          percentage: Math.round((item.count / safeTotalMems) * 100),
          color: occupationColorMap[label] || '#64748b',
        };
      })
    : [];

  const rawTotalComplaints = complaintsGroupRes.reduce((sum, item) => sum + item.count, 0);
  const totalComplaints = rawTotalComplaints || 1;
  const complaintCountsMap = new Map<string, number>(complaintsGroupRes.map((c) => [c.category, c.count]));

  const ALL_COMPLAINT_CATEGORIES = ['Infrastruktur', 'Kebersihan', 'Keamanan', 'Sosial', 'Lainnya'] as const;
  const complaintColorMap: Record<string, string> = {
    'Infrastruktur': '#f43f5e',
    'Kebersihan': '#10b981',
    'Keamanan': '#eab308',
    'Sosial': '#8b5cf6',
    'Lainnya': '#64748b',
  };

  const complaintsByCategory: DemographicDistributionItem[] = rawTotalComplaints > 0
    ? ALL_COMPLAINT_CATEGORIES.map((cat) => {
        const count = complaintCountsMap.get(cat) ?? 0;
        return {
          category: cat,
          label: cat,
          count,
          percentage: Math.round((count / totalComplaints) * 100),
          color: complaintColorMap[cat] || '#64748b',
        };
      })
    : [];

  const totalTerisi = dwellingTypesRes?.terisi ?? 0;
  const totalKosHomestay = dwellingTypesRes?.kos ?? 0;
  const totalKosong = dwellingTypesRes?.kosong ?? 0;

  return {
    totalFamilies: totalFams,
    totalMembers: totalMems,
    totalTenants: totalTens,
    totalDwellings: totalDwells,
    totalHouses: totalDwells,
    totalResidents: totalMems + totalTens,
    totalRenters: totalTens,
    genderStats: { male: totalM, female: totalF },
    genderRatio: {
      male: totalM,
      female: totalF,
      malePct: Math.round((totalM / totalG) * 100),
      femalePct: Math.round((totalF / totalG) * 100),
    },
    ktpDistribution: {
      villageName: sysSet?.villageName || 'Kelurahan Setempat',
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
    },
    ageDistribution,
    educationDistribution,
    occupationDistribution,
    dwellingStatus: {
      terisi: totalTerisi,
      kos: totalKosHomestay,
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
  const dwelling = await resolveDwellingByTokenOrNumber(tokenStr);
  if (!dwelling) return null;

  // Ambil data RT/RW dari systemSettings (selalu id = 1)
  const [settings] = await db
    .select({
      rtName: schema.systemSettings.rtName,
      rwName: schema.systemSettings.rwName,
      villageName: schema.systemSettings.villageName,
    })
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1))
    .limit(1);

  let ownerName: string | null = null;
  let ownerPhone: string | null = null;
  let propertyName: string | null = null;
  let totalRooms: number | null = null;
  let occupiedRooms: number | null = null;
  let availableRooms: number | null = null;

  if (dwelling.type === 'permanen') {
    // Ambil nama pemilik dari tabel users via ownerUserId
    if (dwelling.ownerUserId) {
      const [owner] = await db
        .select({ name: schema.users.name, phone: schema.users.phone })
        .from(schema.users)
        .where(eq(schema.users.id, dwelling.ownerUserId))
        .limit(1);
      ownerName = owner?.name ?? null;
      ownerPhone = owner?.phone ?? null;
    }
  } else if (dwelling.type === 'kos' || dwelling.type === 'homestay') {
    // Ambil data properti komersial dari rentalProperties
    const [prop] = await db
      .select({
        name: schema.rentalProperties.name,
        contactPerson: schema.rentalProperties.contactPerson,
        phone: schema.rentalProperties.phone,
        totalRooms: schema.rentalProperties.totalRooms,
      })
      .from(schema.rentalProperties)
      .where(and(
        eq(schema.rentalProperties.dwellingId, dwelling.id),
        eq(schema.rentalProperties.isActive, true)
      ))
      .limit(1);

    if (prop) {
      propertyName = prop.name;
      ownerName = prop.contactPerson ?? null;
      ownerPhone = prop.phone ?? null;
      totalRooms = prop.totalRooms;

      // Hitung kamar yang sedang terisi (kontrak aktif)
      const [occupiedRes] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.rentalContracts)
        .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
        .where(and(
          eq(schema.rentalProperties.dwellingId, dwelling.id),
          eq(schema.rentalContracts.isActive, true)
        ));
      occupiedRooms = occupiedRes?.count ?? 0;
      availableRooms = Math.max(0, (totalRooms ?? 0) - (occupiedRooms ?? 0));
    }
  }

  return {
    id: dwelling.id,
    blockNumber: dwelling.blockNumber,
    houseNumber: dwelling.houseNumber,
    type: dwelling.type,
    latitude: dwelling.latitude ?? null,
    longitude: dwelling.longitude ?? null,
    ownerName,
    ownerPhone,
    propertyName,
    totalRooms,
    occupiedRooms,
    availableRooms,
    rtName: settings?.rtName ?? null,
    rwName: settings?.rwName ?? null,
    villageName: settings?.villageName ?? null,
  };
}

export async function getDetailedScanDwelling(tokenStr: string | number) {
  const dwelling = await resolveDwellingByTokenOrNumber(String(tokenStr));
  if (!dwelling) return null;

  const [settings] = await db
    .select({
      rtName: schema.systemSettings.rtName,
      rwName: schema.systemSettings.rwName,
      villageName: schema.systemSettings.villageName,
    })
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.id, 1))
    .limit(1);

  let ownerName: string | null = null;
  let ownerPhone: string | null = null;
  let propertyName: string | null = null;
  let totalRooms: number | null = null;
  let occupiedRooms: number | null = null;
  let availableRooms: number | null = null;

  // Hitung jumlah KK aktif yang menghuni (tanpa nama — privasi)
  const [kkCountRes] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.families)
    .where(and(
      eq(schema.families.dwellingId, dwelling.id),
      eq(schema.families.isActive, true)
    ));
  const activeKkCount = kkCountRes?.count ?? 0;

  if (dwelling.type === 'permanen') {
    if (dwelling.ownerUserId) {
      const [owner] = await db
        .select({ name: schema.users.name, phone: schema.users.phone })
        .from(schema.users)
        .where(eq(schema.users.id, dwelling.ownerUserId))
        .limit(1);
      ownerName = owner?.name ?? null;
      ownerPhone = owner?.phone ?? null;
    }
  } else if (dwelling.type === 'kos' || dwelling.type === 'homestay') {
    const [prop] = await db
      .select({
        name: schema.rentalProperties.name,
        contactPerson: schema.rentalProperties.contactPerson,
        phone: schema.rentalProperties.phone,
        totalRooms: schema.rentalProperties.totalRooms,
      })
      .from(schema.rentalProperties)
      .where(and(
        eq(schema.rentalProperties.dwellingId, dwelling.id),
        eq(schema.rentalProperties.isActive, true)
      ))
      .limit(1);

    if (prop) {
      propertyName = prop.name;
      ownerName = prop.contactPerson ?? null;
      ownerPhone = prop.phone ?? null;
      totalRooms = prop.totalRooms;

      const [occupiedRes] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.rentalContracts)
        .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
        .where(and(
          eq(schema.rentalProperties.dwellingId, dwelling.id),
          eq(schema.rentalContracts.isActive, true)
        ));
      occupiedRooms = occupiedRes?.count ?? 0;
      availableRooms = Math.max(0, (totalRooms ?? 0) - (occupiedRooms ?? 0));
    }
  }

  return {
    id: dwelling.id,
    blockNumber: dwelling.blockNumber,
    houseNumber: dwelling.houseNumber,
    type: dwelling.type,
    latitude: dwelling.latitude ?? null,
    longitude: dwelling.longitude ?? null,
    ownerName,
    ownerPhone,
    propertyName,
    totalRooms,
    occupiedRooms,
    availableRooms,
    // Data agregat — tanpa nama penghuni (privasi)
    activeKkCount,
    rtName: settings?.rtName ?? null,
    rwName: settings?.rwName ?? null,
    villageName: settings?.villageName ?? null,
  };
}

export async function checkDwellingOwnership(
  tokenStr: string | number,
  userId: string,
  activeRoleId?: number | null
) {
  const dwelling = await resolveDwellingByTokenOrNumber(String(tokenStr));
  if (!dwelling) {
    return {
      ownershipStatus: 'non-owner' as const,
      redirectTarget: null,
      propertyId: null,
      dwellingId: null,
      targetRoleId: null,
    };
  }

  // --- KELOMPOK 1: KOS / HOMESTAY ---
  if (dwelling.type !== 'permanen') {
    const [prop] = await db
      .select({ id: schema.rentalProperties.id, coordinatorUserId: schema.rentalProperties.coordinatorUserId })
      .from(schema.rentalProperties)
      .where(and(
        eq(schema.rentalProperties.dwellingId, dwelling.id),
        eq(schema.rentalProperties.isActive, true)
      ))
      .limit(1);

    const isOwner = dwelling.ownerUserId === userId;
    const isCoordinator = Boolean(prop && prop.coordinatorUserId === userId);

    // Jika koordinator (baik sebagai pemilik maupun bukan): prioritaskan role Koordinator Kost
    if (isCoordinator) {
      return {
        ownershipStatus: 'koordinator-kos' as const,
        redirectTarget: prop ? `/dashboard/rentals?propertyId=${prop.id}` : '/dashboard/rentals',
        dwellingId: dwelling.id,
        propertyId: prop?.id ?? null,
        targetRoleId: 5, // Koordinator Kost
      };
    }

    // Jika hanya pemilik tapi bukan koordinator: arahkan ke kelola properti warga
    if (isOwner) {
      return {
        ownershipStatus: 'pemilik-kos' as const,
        redirectTarget: prop ? `/dashboard/my-properties/${prop.id}` : '/dashboard/my-properties',
        dwellingId: dwelling.id,
        propertyId: prop?.id ?? null,
        targetRoleId: 6, // Warga
      };
    }

  } else {
    // --- KELOMPOK 2: RUMAH PERMANEN (Pemilik Aset) ---
    if (dwelling.ownerUserId === userId) {
      return {
        ownershipStatus: 'pemilik-permanen' as const,
        redirectTarget: '/dashboard',
        dwellingId: dwelling.id,
        propertyId: null,
        targetRoleId: 6, // Warga
      };
    }
  }

  // --- CEK 2: Kepala Keluarga Permanen (tinggal di hunian ini) ---
  const [kkPermanen] = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(and(
      eq(schema.families.headUserId, userId),
      eq(schema.families.dwellingId, dwelling.id),
      eq(schema.families.isActive, true)
    ))
    .limit(1);
  if (kkPermanen) {
    return {
      ownershipStatus: 'kepala-keluarga-permanen' as const,
      redirectTarget: '/dashboard/family',
      dwellingId: dwelling.id,
      propertyId: null,
      targetRoleId: 6, // Warga
    };
  }

  // --- CEK 3: Kepala Keluarga yang NGEKOS di hunian ini ---
  const [kkKos] = await db
    .select({ familyId: schema.families.id })
    .from(schema.families)
    .innerJoin(schema.rentalContracts, eq(schema.rentalContracts.familyId, schema.families.id))
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .where(and(
      eq(schema.families.headUserId, userId),
      eq(schema.families.isActive, true),
      eq(schema.rentalContracts.isActive, true),
      eq(schema.rentalProperties.dwellingId, dwelling.id)
    ))
    .limit(1);
  if (kkKos) {
    return {
      ownershipStatus: 'kepala-keluarga-kos' as const,
      redirectTarget: '/dashboard/family',
      dwellingId: dwelling.id,
      propertyId: null,
      targetRoleId: 6, // Warga
    };
  }

  // --- TIDAK ADA KAITAN PRIBADI: Cek apakah sedang pakai mode officer (Ketua RT, Sekre, Bendahara, Admin) ---
  if (activeRoleId !== null && activeRoleId !== undefined && activeRoleId >= 1 && activeRoleId <= 4) {
    return {
      ownershipStatus: 'officer' as const,
      redirectTarget: null,
      dwellingId: dwelling.id,
      propertyId: null,
      targetRoleId: activeRoleId,
    };
  }

  // --- Fallback: Tamu Login ---
  return {
    ownershipStatus: 'tamu-login' as const,
    redirectTarget: null,
    dwellingId: dwelling.id,
    propertyId: null,
    targetRoleId: null,
  };
}

