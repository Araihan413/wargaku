import { db } from "@/db";
import { notifications, users, roles, userRoles } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export interface NotificationPayload {
  title: string;
  message: string;
  category?: "personal" | "dinas";
  redirectLink?: string;
}

/**
 * 1. Kirim notifikasi ke 1 User spesifik.
 */
export async function notifyUser(userId: string, payload: NotificationPayload) {
  if (!userId) return;
  try {
    return await db.insert(notifications).values({
      userId,
      title: payload.title,
      message: payload.message,
      category: payload.category || "personal",
      redirectLink: payload.redirectLink || null,
    });
  } catch (err) {
    console.error("[notifyUser] Gagal membuat notifikasi:", err);
  }
}

/**
 * 2. Kirim notifikasi ke banyak User sekaligus (Berdasarkan Array ID User).
 */
export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  if (!userIds || userIds.length === 0) return;

  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return;

  const records = uniqueUserIds.map((userId) => ({
    userId,
    title: payload.title,
    message: payload.message,
    category: payload.category || ("personal" as const),
    redirectLink: payload.redirectLink || null,
  }));

  try {
    return await db.insert(notifications).values(records);
  } catch (err) {
    console.error("[notifyUsers] Gagal membuat notifikasi bulk:", err);
  }
}

/**
 * 3. Kirim notifikasi ke Pengurus berdasarkan Role Slug (misal: 'ketua-rt', 'sekretaris', 'bendahara').
 */
export async function notifyRole(roleSlug: string, payload: NotificationPayload) {
  try {
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(roles.slug, roleSlug), eq(users.status, "active")));

    const userIds = targetUsers.map((u) => u.id);
    return notifyUsers(userIds, { ...payload, category: payload.category || "dinas" });
  } catch (err) {
    console.error("[notifyRole] Gagal membuat notifikasi role:", err);
  }
}

/**
 * 4. Kirim notifikasi ke beberapa Role sekaligus (misal: Ketua RT + Sekretaris).
 */
export async function notifyRoles(roleSlugs: string[], payload: NotificationPayload) {
  if (!roleSlugs || roleSlugs.length === 0) return;

  try {
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(inArray(roles.slug, roleSlugs), eq(users.status, "active")));

    const userIds = targetUsers.map((u) => u.id);
    return notifyUsers(userIds, { ...payload, category: payload.category || "dinas" });
  } catch (err) {
    console.error("[notifyRoles] Gagal membuat notifikasi roles:", err);
  }
}

/**
 * 5. Broadcast notifikasi ke seluruh Warga / Pengguna Aktif.
 */
export async function notifyAllWarga(payload: NotificationPayload) {
  try {
    const targetUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.status, "active"));

    const userIds = targetUsers.map((u) => u.id);
    return notifyUsers(userIds, payload);
  } catch (err) {
    console.error("[notifyAllWarga] Gagal broadcast notifikasi:", err);
  }
}

/**
 * 6. Hapus notifikasi berdasarkan tautan pengalihan (Cascade Delete saat item seperti Pengumuman / Kegiatan dihapus).
 */
export async function deleteNotificationsByRedirectLink(redirectLink: string) {
  if (!redirectLink) return;
  try {
    return await db
      .delete(notifications)
      .where(eq(notifications.redirectLink, redirectLink));
  } catch (err) {
    console.error("[deleteNotificationsByRedirectLink] Gagal menghapus notifikasi:", err);
  }
}
