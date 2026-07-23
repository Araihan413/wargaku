import { NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Mendapatkan daftar notifikasi pengguna
 *     tags: [Notifikasi]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [personal, dinas]
 *         description: 'Kategori notifikasi (default: personal)'
 *     responses:
 *       200:
 *         description: Daftar notifikasi berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 *   patch:
 *     summary: Menandai notifikasi sebagai telah dibaca
 *     tags: [Notifikasi]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID spesifik notifikasi (jika kosong, tandai semua)
 *               category:
 *                 type: string
 *                 enum: [personal, dinas]
 *                 description: Kategori notifikasi (wajib jika menandai semua)
 *     responses:
 *       200:
 *         description: Berhasil menandai notifikasi
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as 'personal' | 'dinas' | 'all') || 'personal';
    const paginated = searchParams.get('paginated') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions list
    const conditions = [eq(notifications.userId, session.user.id)];
    if (category !== 'all') {
      conditions.push(eq(notifications.category, category));
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    if (paginated) {
      return NextResponse.json({
        data: result,
        hasMore: result.length === limit,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, category } = body;

    if (id) {
      // Mark specific notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, session.user.id)
          )
        );
    } else {
      // Mark all notifications in category as read
      const targetCategory = category || 'personal';
      if (targetCategory === 'all') {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.userId, session.user.id),
              eq(notifications.isRead, false)
            )
          );
      } else {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.userId, session.user.id),
              eq(notifications.category, targetCategory),
              eq(notifications.isRead, false)
            )
          );
      }
    }

    return NextResponse.json({ message: 'Berhasil menandai notifikasi sebagai telah dibaca' });
  } catch (error: any) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    const category = searchParams.get('category') as 'personal' | 'dinas' | 'all';

    if (idStr) {
      const id = parseInt(idStr);
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, session.user.id)
          )
        );
    } else {
      const targetCategory = category || 'personal';
      if (targetCategory === 'all') {
        await db
          .delete(notifications)
          .where(eq(notifications.userId, session.user.id));
      } else {
        await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.userId, session.user.id),
              eq(notifications.category, targetCategory)
            )
          );
      }
    }

    return NextResponse.json({ message: 'Berhasil menghapus notifikasi' });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
