import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc, sql, gte, isNull, or } from 'drizzle-orm';
import { notifyAllWarga } from '@/lib/notifications';

export interface CreateBroadcastInput {
  title: string;
  message: string;
  type?: 'info' | 'maintenance' | 'feature' | 'warning';
  sendPush?: boolean;
  sendInAppNotif?: boolean;
  expiresAt?: Date | null;
  createdBy: string;
}

export async function getActiveBroadcastsForUser(userId: string) {
  const now = new Date();

  // Ambil ID broadcast yang sudah di-dismiss oleh pengguna ini
  const dismissedIdsQuery = db
    .select({ broadcastId: schema.broadcastDismissals.broadcastId })
    .from(schema.broadcastDismissals)
    .where(eq(schema.broadcastDismissals.userId, userId));

  const dismissedResult = await dismissedIdsQuery;
  const dismissedIds = dismissedResult.map((d) => d.broadcastId);

  // Ambil broadcast aktif yang belum di-dismiss dan belum kedaluwarsa
  const allActive = await db
    .select()
    .from(schema.systemBroadcasts)
    .where(
      and(
        eq(schema.systemBroadcasts.isActive, true),
        or(
          isNull(schema.systemBroadcasts.expiresAt),
          gte(schema.systemBroadcasts.expiresAt, now)
        )
      )
    )
    .orderBy(
      // Urutkan prioritas: maintenance (1) > warning (2) > feature (3) > info (4)
      sql`CASE ${schema.systemBroadcasts.type} 
            WHEN 'maintenance' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'feature' THEN 3 
            ELSE 4 END`,
      desc(schema.systemBroadcasts.createdAt)
    );

  // Filter yang sudah di-dismiss secara manual di JavaScript (aman & kencang)
  if (dismissedIds.length === 0) return allActive;
  return allActive.filter((b) => !dismissedIds.includes(b.id));
}

export async function dismissBroadcast(userId: string, broadcastId: number) {
  try {
    await db
      .insert(schema.broadcastDismissals)
      .values({
        userId,
        broadcastId,
      })
      .onDuplicateKeyUpdate({
        set: { dismissedAt: new Date() },
      });
  } catch (err) {
    console.error('Error dismissing broadcast:', err);
  }
}

export async function listAllBroadcastsAdmin() {
  const broadcasts = await db
    .select({
      id: schema.systemBroadcasts.id,
      title: schema.systemBroadcasts.title,
      message: schema.systemBroadcasts.message,
      type: schema.systemBroadcasts.type,
      sendPush: schema.systemBroadcasts.sendPush,
      sendInAppNotif: schema.systemBroadcasts.sendInAppNotif,
      isActive: schema.systemBroadcasts.isActive,
      expiresAt: schema.systemBroadcasts.expiresAt,
      createdBy: schema.systemBroadcasts.createdBy,
      createdAt: schema.systemBroadcasts.createdAt,
      updatedAt: schema.systemBroadcasts.updatedAt,
      authorName: schema.users.name,
    })
    .from(schema.systemBroadcasts)
    .leftJoin(schema.users, eq(schema.systemBroadcasts.createdBy, schema.users.id))
    .orderBy(desc(schema.systemBroadcasts.createdAt));

  return broadcasts;
}

export async function createBroadcast(input: CreateBroadcastInput) {
  const [result] = await db.insert(schema.systemBroadcasts).values({
    title: input.title,
    message: input.message,
    type: input.type ?? 'info',
    sendPush: input.sendPush ?? false,
    sendInAppNotif: input.sendInAppNotif ?? false,
    isActive: true,
    expiresAt: input.expiresAt ?? null,
    createdBy: input.createdBy,
  });

  const insertId = result.insertId;

  // Jika admin memilih opsi "Masukkan ke Lonceng Warga"
  if (input.sendInAppNotif) {
    notifyAllWarga({
      title: `[SISTEM] ${input.title}`,
      message: input.message,
      category: 'personal',
      redirectLink: '/dashboard',
    }).catch((err) => console.error('Failed to notify all warga for broadcast:', err));
  }

  return insertId;
}

export async function updateBroadcast(
  id: number,
  data: Partial<Omit<CreateBroadcastInput, 'createdBy'>> & { isActive?: boolean }
) {
  await db
    .update(schema.systemBroadcasts)
    .set({
      ...(data.title && { title: data.title }),
      ...(data.message && { message: data.message }),
      ...(data.type && { type: data.type }),
      ...(data.sendPush !== undefined && { sendPush: data.sendPush }),
      ...(data.sendInAppNotif !== undefined && { sendInAppNotif: data.sendInAppNotif }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      updatedAt: new Date(),
    })
    .where(eq(schema.systemBroadcasts.id, id));
}

export async function deleteBroadcast(id: number) {
  await db.delete(schema.systemBroadcasts).where(eq(schema.systemBroadcasts.id, id));
}
