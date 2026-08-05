import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, gte, desc, sql, inArray } from 'drizzle-orm';

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  module: string;
  description: string;
  ipAddress?: string | null;
}

/**
 * Catat log aktivitas audit trail (non-blocking).
 */
export async function createAuditLog(data: CreateAuditLogInput): Promise<boolean> {
  try {
    await db.insert(schema.activityLogs).values({
      userId: data.userId ?? null,
      action: data.action,
      module: data.module,
      description: data.description,
      ipAddress: data.ipAddress ?? null,
      createdAt: new Date(),
    });
    return true;
  } catch (err) {
    console.error('Gagal mencatat activity_log:', err);
    return false;
  }
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  module?: string;
  search?: string;
  dateRange?: string;
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 15));
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (params.module && params.module !== 'all') {
    conditions.push(eq(schema.activityLogs.module, params.module));
  }

  if (params.search && params.search.trim() !== '') {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(schema.users.name, q),
        like(schema.users.email, q),
        like(schema.activityLogs.action, q),
        like(schema.activityLogs.description, q)
      )
    );
  }

  if (params.dateRange && params.dateRange !== 'all') {
    const now = new Date();
    if (params.dateRange === 'today') {
      conditions.push(gte(schema.activityLogs.createdAt, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)));
    } else if (params.dateRange === '7days') {
      conditions.push(gte(schema.activityLogs.createdAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)));
    } else if (params.dateRange === '30days') {
      conditions.push(gte(schema.activityLogs.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .where(whereClause);

  const totalLogs = totalResult?.count || 0;
  const totalPages = Math.ceil(totalLogs / limit) || 1;

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
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .where(whereClause)
    .orderBy(desc(schema.activityLogs.createdAt))
    .limit(limit)
    .offset(offset);

  // Ambil primary role untuk setiap user yang muncul
  const userIds = [...new Set(rawLogs.map((l) => l.userId).filter(Boolean) as string[])];
  const userRolesMap = new Map<string, string>();

  if (userIds.length > 0) {
    const primaryRoles = await db
      .select({
        userId: schema.userRoles.userId,
        roleName: schema.roles.name,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(and(inArray(schema.userRoles.userId, userIds), eq(schema.userRoles.isPrimary, true)));

    for (const r of primaryRoles) {
      userRolesMap.set(r.userId, r.roleName);
    }
  }

  const logs = rawLogs.map((log) => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    module: log.module,
    description: log.description,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
    actorName: log.actorName,
    actorEmail: log.actorEmail,
    actorRoleName: log.userId ? (userRolesMap.get(log.userId) ?? 'Pengguna') : null,
  }));

  return {
    logs,
    pagination: { totalLogs, totalPages, currentPage: page, limit },
  };
}

export async function getAuditLogStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const [totalResult] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.activityLogs);
  const [todayResult] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(schema.activityLogs).where(gte(schema.activityLogs.createdAt, startOfToday));
  const [usersResult] = await db.select({ count: sql<number>`count(DISTINCT ${schema.activityLogs.userId})`.mapWith(Number) }).from(schema.activityLogs);
  const [securityResult] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.activityLogs)
    .where(or(like(schema.activityLogs.action, '%PERMISSION%'), like(schema.activityLogs.action, '%ROLE%'), like(schema.activityLogs.action, '%PASSWORD%'), like(schema.activityLogs.action, '%SUSPEND%'), like(schema.activityLogs.action, '%LOGIN%')));

  return {
    totalLogsCount: totalResult?.count || 0,
    todayLogsCount: todayResult?.count || 0,
    uniqueUsersCount: usersResult?.count || 0,
    securityEventsCount: securityResult?.count || 0,
  };
}
