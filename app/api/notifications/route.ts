import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { listNotifications, markNotificationsRead, deleteNotifications } from '@/db/queries/system/notification.queries';

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

    const result = await listNotifications(session.user.id, category === 'all' ? undefined : category);

    if (paginated) {
      return NextResponse.json({ data: result, hasMore: result.length === limit });
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
    const { id } = body;

    await markNotificationsRead(session.user.id, id);

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

    const id = idStr ? parseInt(idStr) : undefined;
    await deleteNotifications(session.user.id, id ? [id] : []);

    return NextResponse.json({ message: 'Berhasil menghapus notifikasi' });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
