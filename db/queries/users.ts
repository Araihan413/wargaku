import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, desc, sql, notInArray } from "drizzle-orm";

export interface ListUsersOptions {
  limit?: number;
  offset?: number;
  roleId?: number;
  status?: "pending" | "active" | "suspended";
  query?: string;
  withoutFamily?: boolean;
  excludeExceptId?: string;
}

export async function listUsers(options: ListUsersOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions = [];

  if (options.roleId !== undefined) {
    conditions.push(eq(schema.users.roleId, options.roleId));
  }
  if (options.status !== undefined) {
    conditions.push(eq(schema.users.status, options.status));
  }
  if (options.query) {
    conditions.push(
      or(
        like(schema.users.name, `%${options.query}%`),
        like(schema.users.email, `%${options.query}%`),
        like(schema.users.nik, `%${options.query}%`)
      )
    );
  }

  if (options.withoutFamily) {
    const familiesList = await db
      .select({ headUserId: schema.families.headUserId })
      .from(schema.families);
    
    let headUserIds = familiesList.map((f) => f.headUserId).filter(Boolean) as string[];
    
    if (options.excludeExceptId) {
      headUserIds = headUserIds.filter((id) => id !== options.excludeExceptId);
    }

    if (headUserIds.length > 0) {
      conditions.push(notInArray(schema.users.id, headUserIds));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      nik: schema.users.nik,
      phone: schema.users.phone,
      photo: schema.users.photo,
      status: schema.users.status,
      roleId: schema.users.roleId,
      roleName: schema.roles.name,
      roleSlug: schema.roles.slug,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.users.createdAt));

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(whereClause);

  const total = Number(totalResult[0]?.count ?? 0);

  return {
    data,
    metadata: {
      total,
      limit,
      offset,
    },
  };
}

export async function listRoles() {
  return db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
    })
    .from(schema.roles)
    .orderBy(schema.roles.id);
}

export async function createUser(userData: typeof schema.users.$inferInsert) {
  await db.insert(schema.users).values(userData);
  return userData;
}

export async function updateUserRole(userId: string, roleId: number) {
  return db
    .update(schema.users)
    .set({ roleId, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function updateUserStatus(userId: string, status: "pending" | "active" | "suspended") {
  return db
    .update(schema.users)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db
    .update(schema.users)
    .set({ password: passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}
