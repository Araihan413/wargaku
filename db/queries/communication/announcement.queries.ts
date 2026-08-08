import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, like, or, ne } from "drizzle-orm";
import { deleteCloudinaryFileByUrl } from "@/lib/cloudinary";

export interface ListAnnouncementsOptions {
  search?: string;
  category?: string;
  isPinned?: boolean;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  category: "umum" | "penting" | "mendesak";
  attachments?: string | null;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  category?: "umum" | "penting" | "mendesak";
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

export async function listAnnouncements(options: ListAnnouncementsOptions = {}) {
  const { search = "", category = "", isPinned } = options;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(schema.announcements.title, `%${search}%`),
        like(schema.announcements.content, `%${search}%`)
      )
    );
  }

  if (category && ["umum", "penting", "mendesak"].includes(category)) {
    conditions.push(eq(schema.announcements.category, category as "umum" | "penting" | "mendesak"));
  }

  if (isPinned) {
    conditions.push(eq(schema.announcements.isPinned, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      attachments: schema.announcements.attachments,
      isPinned: schema.announcements.isPinned,
      pinUntil: schema.announcements.pinUntil,
      createdBy: schema.announcements.createdBy,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
      updatedAt: schema.announcements.updatedAt,
      creatorName: schema.users.name,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .where(whereClause)
    .orderBy(
      desc(schema.announcements.isPinned),
      desc(schema.announcements.createdAt)
    );
}

export async function getAnnouncementById(id: number) {
  const [item] = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      content: schema.announcements.content,
      category: schema.announcements.category,
      attachments: schema.announcements.attachments,
      isPinned: schema.announcements.isPinned,
      pinUntil: schema.announcements.pinUntil,
      createdBy: schema.announcements.createdBy,
      publishedAt: schema.announcements.publishedAt,
      createdAt: schema.announcements.createdAt,
      updatedAt: schema.announcements.updatedAt,
      creatorName: schema.users.name,
    })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.announcements.createdBy, schema.users.id))
    .where(eq(schema.announcements.id, id));

  return item ?? null;
}

export async function createAnnouncement(input: CreateAnnouncementInput, userId: string) {
  const [result] = await db.insert(schema.announcements).values({
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category,
    attachments: input.attachments || null,
    isPinned: false,
    createdBy: userId,
    publishedAt: new Date(),
  });

  return result.insertId;
}

export async function updateAnnouncement(id: number, input: UpdateAnnouncementInput) {
  const existing = await getAnnouncementById(id);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const updateData: Record<string, any> = {};

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.content !== undefined) updateData.content = input.content.trim();
  if (input.category !== undefined && ["umum", "penting", "mendesak"].includes(input.category)) {
    updateData.category = input.category;
  }
  if (input.attachments !== undefined) updateData.attachments = input.attachments ? input.attachments : null;
  if (input.isPinned !== undefined) {
    const nextPinned = Boolean(input.isPinned);
    if (nextPinned) {
      const pinnedList = await db
        .select({ id: schema.announcements.id })
        .from(schema.announcements)
        .where(and(eq(schema.announcements.isPinned, true), ne(schema.announcements.id, id)));

      if (pinnedList.length >= 3) {
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
    .update(schema.announcements)
    .set(updateData)
    .where(eq(schema.announcements.id, id));

  if (input.attachments !== undefined && existing.attachments !== input.attachments) {
    const oldUrls = parseUrlsFromAttachments(existing.attachments);
    const newUrls = parseUrlsFromAttachments(input.attachments);
    const removedUrls = oldUrls.filter((url) => !newUrls.includes(url));

    for (const url of removedUrls) {
      deleteCloudinaryFileByUrl(url).catch((err) =>
        console.error("[Cloudinary Cleanup] Gagal menghapus lampiran pengumuman lama:", err)
      );
    }
  }
}

export async function deleteAnnouncement(id: number) {
  const existing = await getAnnouncementById(id);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  await db.delete(schema.announcements).where(eq(schema.announcements.id, id));

  const urls = parseUrlsFromAttachments(existing.attachments);
  for (const url of urls) {
    deleteCloudinaryFileByUrl(url).catch((err) =>
      console.error("[Cloudinary Cleanup] Gagal menghapus lampiran pengumuman:", err)
    );
  }
}
