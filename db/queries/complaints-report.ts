import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, count, desc, asc, gte, lt, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────
// Overview / KPI Stats
// ─────────────────────────────────────────────────

export async function getComplaintsReportOverview() {
  const [totalComplaints] = await db
    .select({ count: count() })
    .from(schema.complaints);

  const [activeComplaints] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(
      or(
        eq(schema.complaints.status, "menunggu"),
        eq(schema.complaints.status, "proses")
      )
    );

  const [totalAnnouncements] = await db
    .select({ count: count() })
    .from(schema.announcements);

  const [totalActivities] = await db
    .select({ count: count() })
    .from(schema.activities);

  return {
    totalComplaints: totalComplaints?.count || 0,
    activeComplaints: activeComplaints?.count || 0,
    totalAnnouncements: totalAnnouncements?.count || 0,
    totalActivities: totalActivities?.count || 0,
  };
}

// ─────────────────────────────────────────────────
// Complaints List (Paginated)
// ─────────────────────────────────────────────────

export interface GetComplaintsListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}

export async function getComplaintsReportList(params: GetComplaintsListParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(
      eq(schema.complaints.status, params.status as "menunggu" | "proses" | "selesai" | "ditolak")
    );
  }

  if (params.category && params.category !== "all") {
    conditions.push(
      eq(
        schema.complaints.category,
        params.category as "Infrastruktur" | "Kebersihan" | "Keamanan" | "Sosial" | "Lainnya"
      )
    );
  }

  if (params.search && params.search.trim() !== "") {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(schema.complaints.trackingCode, q),
        like(schema.complaints.reporterName, q),
        like(schema.complaints.description, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.complaints)
    .where(whereClause);

  const totalItems = totalResult?.count || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const rawList = await db
    .select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      reporterPhone: schema.complaints.reporterPhone,
      category: schema.complaints.category,
      description: schema.complaints.description,
      photoPath: schema.complaints.photoPath,
      status: schema.complaints.status,
      responseNote: schema.complaints.responseNote,
      handledBy: schema.complaints.handledBy,
      createdAt: schema.complaints.createdAt,
      resolvedAt: schema.complaints.resolvedAt,
      handlerName: schema.users.name,
    })
    .from(schema.complaints)
    .leftJoin(schema.users, eq(schema.complaints.handledBy, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.complaints.createdAt))
    .limit(limit)
    .offset(offset);

  const data = rawList.map((c) => ({
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
  }));

  return {
    data,
    pagination: { totalItems, totalPages, currentPage: page, limit },
  };
}

// ─────────────────────────────────────────────────
// Announcements List (Paginated)
// ─────────────────────────────────────────────────

export interface GetAnnouncementsListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

export async function getAnnouncementsReportList(params: GetAnnouncementsListParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.category && params.category !== "all") {
    conditions.push(
      eq(schema.announcements.category, params.category as "umum" | "penting" | "mendesak")
    );
  }

  if (params.search && params.search.trim() !== "") {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(schema.announcements.title, q),
        like(schema.announcements.content, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.announcements)
    .where(whereClause);

  const totalItems = totalResult?.count || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const rawList = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      createdBy: schema.announcements.createdBy,
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

  const data = rawList.map((a) => ({
    ...a,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  return {
    data,
    pagination: { totalItems, totalPages, currentPage: page, limit },
  };
}

// ─────────────────────────────────────────────────
// Activities List (Paginated)
// ─────────────────────────────────────────────────

export interface GetActivitiesListParams {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
}

export async function getActivitiesReportList(params: GetActivitiesListParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];
  const now = new Date();

  if (params.filter === "upcoming") {
    conditions.push(gte(schema.activities.eventDate, now));
  } else if (params.filter === "past") {
    conditions.push(lt(schema.activities.eventDate, now));
  }

  if (params.search && params.search.trim() !== "") {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(schema.activities.title, q),
        like(schema.activities.description, q),
        like(schema.activities.location, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activities)
    .where(whereClause);

  const totalItems = totalResult?.count || 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const rawList = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
      createdBy: schema.activities.createdBy,
      createdAt: schema.activities.createdAt,
      creatorName: schema.users.name,
    })
    .from(schema.activities)
    .leftJoin(schema.users, eq(schema.activities.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(
      desc(schema.activities.isPinned),
      params.filter === "past"
        ? desc(schema.activities.eventDate)
        : asc(schema.activities.eventDate)
    )
    .limit(limit)
    .offset(offset);

  const data = rawList.map((a) => ({
    ...a,
    eventDate: a.eventDate ? a.eventDate.toISOString() : null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  return {
    data,
    pagination: { totalItems, totalPages, currentPage: page, limit },
  };
}
