import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// ==========================================
// NOTIFICATIONS QUERIES
// ==========================================

/**
 * Mengambil daftar notifikasi milik user tertentu.
 */
export async function listNotifications(
  userId: string,
  options: {
    category?: "personal" | "dinas" | "all";
    paginated?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { category = "personal", limit = 20, offset = 0 } = options;

  const conditions = [eq(notifications.userId, userId)];
  if (category !== "all") {
    conditions.push(eq(notifications.category, category));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Menandai notifikasi sebagai sudah dibaca.
 * Jika `id` diberikan, hanya notifikasi tersebut yang ditandai.
 * Jika tidak, semua notifikasi dalam kategori yang dipilih ditandai.
 */
export async function markNotificationsRead(
  userId: string,
  id?: number,
  category?: "personal" | "dinas" | "all"
) {
  if (id) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  } else {
    const targetCategory = category || "personal";
    if (targetCategory === "all") {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.category, targetCategory),
            eq(notifications.isRead, false)
          )
        );
    }
  }
}

/**
 * Menghapus notifikasi milik user.
 * Jika `id` diberikan, hanya notifikasi tersebut yang dihapus.
 * Jika tidak, semua notifikasi dalam kategori yang dipilih dihapus.
 */
export async function deleteNotifications(
  userId: string,
  id?: number,
  category?: "personal" | "dinas" | "all"
) {
  if (id) {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  } else {
    const targetCategory = category || "personal";
    if (targetCategory === "all") {
      await db.delete(notifications).where(eq(notifications.userId, userId));
    } else {
      await db
    }
  }
}

/**
 * Membuat notifikasi baru.
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  category?: "personal" | "dinas";
  redirectLink?: string;
}) {
  return db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    category: data.category || "personal",
    redirectLink: data.redirectLink || null,
  });
}

