import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, asc, gte, lt, like, or, ne } from "drizzle-orm";
import { deleteCloudinaryFileByUrl } from "@/lib/cloudinary";

export interface ListActivitiesOptions {
  search?: string;
  filter?: "all" | "upcoming" | "past";
  isPinned?: boolean;
}

export interface CreateActivityInput {
  title: string;
  description?: string | null;
  eventDate: string | Date;
  location?: string | null;
  attachments?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  eventDate?: string | Date;
  location?: string | null;
  attachments?: string | null;
  isPinned?: boolean;
}

function parseUrlsFromAttachments(attachments: string | null | undefined): string[] {
  if (!attachments) return [];
  try {
    if (attachments.startsWith("[")) {
      const parsed: Array<{ url?: string } | string> = JSON.parse(attachments);
      return parsed
        .map((item) => (typeof item === "string" ? item : item.url || ""))
        .filter(Boolean);
    }
    return [attachments];
  } catch {
    return [attachments];
  }
}

export async function listActivities(options: ListActivitiesOptions = {}) {
  const { search = "", filter = "all", isPinned } = options;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(schema.activities.title, `%${search}%`),
        like(schema.activities.description, `%${search}%`),
        like(schema.activities.location, `%${search}%`)
      )
    );
  }

  const now = new Date();
  if (filter === "upcoming") {
    conditions.push(gte(schema.activities.eventDate, now));
  } else if (filter === "past") {
    conditions.push(lt(schema.activities.eventDate, now));
  }

  if (isPinned) {
    conditions.push(eq(schema.activities.isPinned, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      attachments: schema.activities.attachments,
      isPinned: schema.activities.isPinned,
      createdBy: schema.activities.createdBy,
      createdAt: schema.activities.createdAt,
      updatedAt: schema.activities.updatedAt,
      creatorName: schema.users.name,
    })
    .from(schema.activities)
    .leftJoin(schema.users, eq(schema.activities.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(
      desc(schema.activities.isPinned),
      filter === "past" ? desc(schema.activities.eventDate) : asc(schema.activities.eventDate)
    );
}

export async function getActivityById(id: number) {
  const [item] = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      description: schema.activities.description,
      eventDate: schema.activities.eventDate,
      location: schema.activities.location,
      attachments: schema.activities.attachments,
      isPinned: schema.activities.isPinned,
      createdBy: schema.activities.createdBy,
      createdAt: schema.activities.createdAt,
      updatedAt: schema.activities.updatedAt,
      creatorName: schema.users.name,
    })
    .from(schema.activities)
    .leftJoin(schema.users, eq(schema.activities.createdBy, schema.users.id))
    .where(eq(schema.activities.id, id));

  return item ?? null;
}

export async function createActivity(input: CreateActivityInput, userId: string) {
  const [result] = await db.insert(schema.activities).values({
    title: input.title.trim(),
    description: input.description ? input.description.trim() : null,
    eventDate: new Date(input.eventDate),
    location: input.location ? input.location.trim() : null,
    attachments: input.attachments || null,
    isPinned: false,
    createdBy: userId,
  });

  return result.insertId;
}

export async function updateActivity(id: number, input: UpdateActivityInput) {
  const existing = await getActivityById(id);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const updateData: Record<string, any> = {};

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description ? input.description.trim() : null;
  if (input.eventDate !== undefined) updateData.eventDate = new Date(input.eventDate);
  if (input.location !== undefined) updateData.location = input.location ? input.location.trim() : null;
  if (input.attachments !== undefined) updateData.attachments = input.attachments ? input.attachments : null;
  if (input.isPinned !== undefined) {
    const nextPinned = Boolean(input.isPinned);
    if (nextPinned) {
      const pinnedList = await db
        .select({ id: schema.activities.id })
        .from(schema.activities)
        .where(and(eq(schema.activities.isPinned, true), ne(schema.activities.id, id)));

      if (pinnedList.length >= 1) {
        throw new Error("PINNED_LIMIT_EXCEEDED");
      }
    }
    updateData.isPinned = nextPinned;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("NO_CHANGES");
  }

  updateData.updatedAt = new Date();

  await db
    .update(schema.activities)
    .set(updateData)
    .where(eq(schema.activities.id, id));

  if (input.attachments !== undefined && existing.attachments !== input.attachments) {
    const oldUrls = parseUrlsFromAttachments(existing.attachments);
    const newUrls = parseUrlsFromAttachments(input.attachments);
    const removedUrls = oldUrls.filter((url) => !newUrls.includes(url));

    for (const url of removedUrls) {
      deleteCloudinaryFileByUrl(url).catch((err) =>
        console.error("[Cloudinary Cleanup] Gagal menghapus lampiran kegiatan lama:", err)
      );
    }
  }
}

export async function deleteActivity(id: number) {
  const existing = await getActivityById(id);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  await db.delete(schema.activities).where(eq(schema.activities.id, id));

  const urls = parseUrlsFromAttachments(existing.attachments);
  for (const url of urls) {
    deleteCloudinaryFileByUrl(url).catch((err) =>
      console.error("[Cloudinary Cleanup] Gagal menghapus lampiran kegiatan:", err)
    );
  }
}
