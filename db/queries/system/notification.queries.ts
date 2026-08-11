import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  category?: 'personal' | 'dinas';
  redirectLink?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  const [result] = await db.insert(schema.notifications).values({
    userId: input.userId,
    title: input.title,
    message: input.message,
    category: input.category ?? 'personal',
    redirectLink: input.redirectLink ?? null,
    isRead: false,
  });
  return result.insertId;
}

export async function listNotifications(
  userId: string,
  category?: 'personal' | 'dinas',
  limit = 20,
  offset = 0
) {
  const conditions = [eq(schema.notifications.userId, userId)];
  if (category) {
    conditions.push(eq(schema.notifications.category, category));
  }

  return db
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function markNotificationsRead(userId: string, notificationId?: number, category?: 'personal' | 'dinas') {
  if (notificationId) {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId)));
  } else {
    const conditions = [eq(schema.notifications.userId, userId)];
    if (category) conditions.push(eq(schema.notifications.category, category));
    await db.update(schema.notifications).set({ isRead: true }).where(and(...conditions));
  }
}

export async function deleteNotifications(
  userId: string,
  notificationIds?: number[],
  category?: 'personal' | 'dinas'
) {
  const conditions = [eq(schema.notifications.userId, userId)];

  if (notificationIds && notificationIds.length > 0) {
    conditions.push(inArray(schema.notifications.id, notificationIds));
  } else if (category) {
    conditions.push(eq(schema.notifications.category, category));
  }

  await db
    .delete(schema.notifications)
    .where(and(...conditions));
}
