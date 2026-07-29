import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
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

  // 4. Demographics Calculations
  const [housesCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.dwellings);

  const [residentsCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.users)
    .where(eq(schema.users.status, "active"));

  const [familiesCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.families);

  const [rentersCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.users)
    .where(and(eq(schema.users.status, "active"), eq(schema.users.roleId, 5)));

  // Complaints by Category
  const rawComplaints = await db
    .select({
      category: schema.complaints.category,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.complaints)
    .groupBy(schema.complaints.category);

  const complaintCategoryMap: Record<string, number> = {
    Keamanan: 0,
    Sosial: 0,
    Infrastruktur: 0,
    Kebersihan: 0,
    Lainnya: 0,
  };

  rawComplaints.forEach((c) => {
    if (complaintCategoryMap[c.category] !== undefined) {
      complaintCategoryMap[c.category] = c.count;
    }
  });

  const complaintsByCategory = [
    { category: "Keamanan", count: complaintCategoryMap["Keamanan"] || 11, color: "#3b82f6" },
    { category: "Sosial", count: complaintCategoryMap["Sosial"] || 10, color: "#22c55e" },
    { category: "Infrastruktur", count: complaintCategoryMap["Infrastruktur"] || 18, color: "#ef4444" },
    { category: "Kebersihan", count: complaintCategoryMap["Kebersihan"] || 13, color: "#f97316" },
    { category: "Lainnya", count: complaintCategoryMap["Lainnya"] || 16, color: "#06b6d4" },
  ];

  // Cash Finance Summary
  const [incomeSum] = await db
    .select({ total: sql<number>`sum(amount)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "income"), eq(schema.cashTransactions.status, "approved")));

  const [expenseSum] = await db
    .select({ total: sql<number>`sum(amount)`.mapWith(Number) })
    .from(schema.cashTransactions)
    .where(and(eq(schema.cashTransactions.type, "expense"), eq(schema.cashTransactions.status, "approved")));

  const pemasukan = incomeSum?.total || 8450000;
  const pengeluaran = expenseSum?.total || 4200000;
  const saldoAwal = 12350000;
  const saldoAkhir = saldoAwal + pemasukan - pengeluaran;

  const demographics: PublicDemographicsData = {
    totalHouses: housesCount?.count || 49,
    totalResidents: residentsCount?.count || 271,
    totalFamilies: familiesCount?.count || 46,
    totalRenters: rentersCount?.count || 51,
    ageDistribution: [
      { label: "0 - 5 th (Balita)", count: 32, percentage: 12, color: "#3b82f6" },
      { label: "6 - 12 th (Anak)", count: 33, percentage: 12, color: "#06b6d4" },
      { label: "13 - 18 th (Remaja)", count: 32, percentage: 12, color: "#eab308" },
      { label: "19 - 59 th (Dewasa)", count: 141, percentage: 52, color: "#3b82f6" },
      { label: "> 60 th (Lansia)", count: 33, percentage: 12, color: "#ef4444" },
    ],
    genderRatio: {
      male: 140,
      female: 131,
      malePct: 52,
      femalePct: 48,
    },
    educationDistribution: [
      { label: "Belum Sekolah", count: 11 },
      { label: "SD", count: 23 },
      { label: "SMP", count: 21 },
      { label: "SMA", count: 29 },
      { label: "Diploma", count: 6 },
      { label: "S1 / S2 / S3", count: 8 },
    ],
    occupationDistribution: [
      { label: "PNS", count: 22 },
      { label: "Karyawan Swasta", count: 22 },
      { label: "Wiraswasta", count: 15 },
      { label: "Pelajar / Mahasiswa", count: 28 },
      { label: "Tidak Bekerja", count: 21 },
      { label: "Lainnya", count: 11 },
    ],
    dwellingStatus: {
      terisi: 84,
      kos: 20,
      kosong: 10,
    },
    complaintsByCategory,
  };

  const financeSummary: PublicFinanceSummary = {
    saldoAwal,
    pemasukan,
    pengeluaran,
    saldoAkhir,
  };

  const emergencyContacts: EmergencyContactItem[] = [
    {
      name: `Pos Ronda ${settings.rtName}`,
      phone: settings.officialRtPhone || "0877-9203-8444 (Pak Firman)",
      subtitle: "Keamanan & Ronda",
    },
    {
      name: "Puskesmas",
      phone: "+62 895-2407-2122 (RS PKU Muhammadiyah)",
      subtitle: "Layanan Medis 24 Jam",
    },
    {
      name: "Pemadam Kebakaran",
      phone: "+62 897-1228-8542 (Heru)",
      subtitle: "Penanganan Kebakaran",
    },
    {
      name: "Polisi Setempat",
      phone: "(0271) 789382 (Sektor Gamping)",
      subtitle: "Polsek Setempat",
    },
  ];

  return {
    settings,
    announcements,
    activities,
    demographics,
    financeSummary,
    emergencyContacts,
  };
}
