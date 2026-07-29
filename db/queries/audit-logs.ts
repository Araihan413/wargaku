import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, gte, desc, sql } from "drizzle-orm";

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  module?: string;
  search?: string;
  dateRange?: string; // 'today' | '7days' | '30days' | 'all'
}

export interface AuditLogItemQuery {
  id: number;
  userId: string;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  actorNik: string | null;
  actorRoleName: string | null;
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 15));
  const offset = (page - 1) * limit;

  const conditions = [];

  // Filter Modul
  if (params.module && params.module !== "all") {
    conditions.push(eq(schema.activityLogs.module, params.module));
  }

  // Filter Search
  if (params.search && params.search.trim() !== "") {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(schema.users.name, q),
        like(schema.users.nik, q),
        like(schema.users.email, q),
        like(schema.activityLogs.action, q),
        like(schema.activityLogs.description, q)
      )
    );
  }

  // Filter Date Range
  if (params.dateRange && params.dateRange !== "all") {
    const now = new Date();
    if (params.dateRange === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      conditions.push(gte(schema.activityLogs.createdAt, startOfToday));
    } else if (params.dateRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      conditions.push(gte(schema.activityLogs.createdAt, sevenDaysAgo));
    } else if (params.dateRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      conditions.push(gte(schema.activityLogs.createdAt, thirtyDaysAgo));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 1. Get total count
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .where(whereClause);

  const totalLogs = totalResult?.count || 0;
  const totalPages = Math.ceil(totalLogs / limit) || 1;

  // 2. Get paginated items
  const rawLogs = await db
    .select({
      id: schema.activityLogs.id,
      userId: schema.activityLogs.userId,
      action: schema.activityLogs.action,
      module: schema.activityLogs.module,
      description: schema.activityLogs.description,
      ipAddress: schema.activityLogs.ipAddress,
      createdAt: schema.activityLogs.createdAt,
      actorName: schema.users.name,
      actorEmail: schema.users.email,
      actorNik: schema.users.nik,
      actorRoleId: schema.users.roleId,
      actorRoleName: schema.roles.name,
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(whereClause)
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const logs: AuditLogItemQuery[] = rawLogs.map((log) => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    module: log.module,
    description: log.description,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
    actorName: log.actorName,
    actorEmail: log.actorEmail,
    actorNik: log.actorNik,
    actorRoleName: log.actorRoleName || (log.actorRoleId === 1 ? "Super Admin" : "Pengguna"),
  }));

  return {
    logs,
    pagination: {
      totalLogs,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export async function getAuditLogStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  // Total logs count
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs);

  // Today logs count
  const [todayResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs)
    .where(gte(schema.activityLogs.createdAt, startOfToday));

  // Unique active users count
  const [usersResult] = await db
    .select({ count: sql<number>`count(DISTINCT ${schema.activityLogs.userId})`.mapWith(Number) })
    .from(schema.activityLogs);

  // Sensitive security events count (UPDATE_PERMISSIONS, LOGIN, SUSPEND, RESET_PASSWORD)
  const [securityResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs)
    .where(
      or(
        like(schema.activityLogs.action, "%PERMISSION%"),
        like(schema.activityLogs.action, "%ROLE%"),
        like(schema.activityLogs.action, "%PASSWORD%"),
        like(schema.activityLogs.action, "%SUSPEND%"),
        like(schema.activityLogs.action, "%LOGIN%")
      )
    );

  return {
    totalLogsCount: totalResult?.count || 0,
    todayLogsCount: todayResult?.count || 0,
    uniqueUsersCount: usersResult?.count || 0,
    securityEventsCount: securityResult?.count || 0,
  };
}
