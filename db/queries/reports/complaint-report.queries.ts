import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, count, desc, like, or, sql } from 'drizzle-orm';

export async function getComplaintsReportOverview() {
  const [complaintStats] = await db
    .select({
      totalComplaints: count(),
      pendingComplaints: sql<number>`SUM(CASE WHEN ${schema.complaints.status} = 'menunggu' THEN 1 ELSE 0 END)`,
      processComplaints: sql<number>`SUM(CASE WHEN ${schema.complaints.status} = 'proses' THEN 1 ELSE 0 END)`,
      resolvedComplaints: sql<number>`SUM(CASE WHEN ${schema.complaints.status} = 'selesai' THEN 1 ELSE 0 END)`,
      rejectedComplaints: sql<number>`SUM(CASE WHEN ${schema.complaints.status} = 'ditolak' THEN 1 ELSE 0 END)`,
    })
    .from(schema.complaints);

  const [announcementsRes] = await db.select({ count: count() }).from(schema.announcements);
  const [activitiesRes] = await db.select({ count: count() }).from(schema.activities);

  const pending = Number(complaintStats?.pendingComplaints || 0);
  const process = Number(complaintStats?.processComplaints || 0);
  const resolved = Number(complaintStats?.resolvedComplaints || 0);
  const rejected = Number(complaintStats?.rejectedComplaints || 0);
  const total = Number(complaintStats?.totalComplaints || 0);

  return {
    totalComplaints: total,
    activeComplaints: pending + process,
    pendingComplaints: pending,
    processComplaints: process,
    resolvedComplaints: resolved,
    rejectedComplaints: rejected,
    totalAnnouncements: announcementsRes?.count || 0,
    totalActivities: activitiesRes?.count || 0,
  };
}

export async function getComplaintsReportList(options: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options.status && options.status !== 'all') {
    conditions.push(eq(schema.complaints.status, options.status as any));
  }
  if (options.category && options.category !== 'all') {
    conditions.push(eq(schema.complaints.category, options.category as any));
  }
  if (options.search && options.search.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(schema.complaints.trackingCode, q),
        like(schema.complaints.reporterName, q),
        like(schema.complaints.description, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ count: count() }).from(schema.complaints).where(whereClause);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const rawData = await db
    .select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      reporterPhone: schema.complaints.reporterPhone,
      category: schema.complaints.category,
      description: schema.complaints.description,
      photoPath: schema.complaints.photoPath,
      dwellingId: schema.complaints.dwellingId,
      status: schema.complaints.status,
      responseNote: schema.complaints.responseNote,
      handledBy: schema.complaints.handledBy,
      handlerName: schema.users.name,
      resolvedAt: schema.complaints.resolvedAt,
      createdAt: schema.complaints.createdAt,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.complaints)
    .leftJoin(schema.users, eq(schema.complaints.handledBy, schema.users.id))
    .leftJoin(schema.dwellings, eq(schema.complaints.dwellingId, schema.dwellings.id))
    .where(whereClause)
    .orderBy(desc(schema.complaints.createdAt))
    .limit(limit)
    .offset(offset);

  const data = rawData.map((item) => ({
    ...item,
    dwellingAddress: item.blockNumber && item.houseNumber ? `Blok ${item.blockNumber} No. ${item.houseNumber}` : null,
  }));

  return {
    data,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
}

export async function getAnnouncementsReportList(options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options.category && options.category !== 'all') {
    conditions.push(eq(schema.announcements.category, options.category as any));
  }
  if (options.search && options.search.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(schema.announcements.title, q),
        like(schema.announcements.content, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ count: count() }).from(schema.announcements).where(whereClause);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      isPinned: schema.announcements.isPinned,
      createdBy: schema.announcements.createdBy,
      creatorName: schema.users.name,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
}

export async function getActivitiesReportList(options: {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options.search && options.search.trim()) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(schema.activities.title, q),
        like(schema.activities.description, q),
        like(schema.activities.location, q)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ count: count() }).from(schema.activities).where(whereClause);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      isPinned: schema.activities.isPinned,
      createdBy: schema.activities.createdBy,
      creatorName: schema.users.name,
      createdAt: schema.activities.createdAt,
    })
    .from(schema.activities)
    .leftJoin(schema.users, eq(schema.activities.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.activities.eventDate))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: { totalItems: total, totalPages, currentPage: page, limit },
  };
}
