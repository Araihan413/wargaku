import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { listNotifications, markNotificationsRead, deleteNotifications } from '@/db/queries/system/notification.queries';
import { markNotificationReadSchema } from '@/lib/validations/system';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Mendapatkan daftar notifikasi pengguna
 *     description: Mengambil notifikasi milik pengguna yang sedang login berdasarkan kategori (personal/dinas/all) dan paginasi.
 *     tags:
 *       - Notifikasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [personal, dinas, all]
 *           default: personal
 *         description: Kategori notifikasi
 *       - in: query
 *         name: paginated
 *         schema:
 *           type: boolean
 *         description: Jika true, mengembalikan format { data, hasMore }
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Daftar notifikasi berhasil diambil
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 *   patch:
 *     summary: Menandai notifikasi sebagai telah dibaca
 *     description: Mengubah status isRead menjadi true pada satu notifikasi spesifik atau seluruh notifikasi pengguna.
 *     tags:
 *       - Notifikasi
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
 *                 description: ID spesifik notifikasi (jika kosong, tandai semua notifikasi pengguna sebagai dibaca)
 *     responses:
 *       200:
 *         description: Berhasil menandai notifikasi
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus notifikasi
 *     description: Menghapus notifikasi spesifik atau semua notifikasi milik pengguna yang login.
 *     tags:
 *       - Notifikasi
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: ID notifikasi (jika kosong, hapus semua notifikasi pengguna)
 *     responses:
 *       200:
 *         description: Berhasil menghapus notifikasi
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') as 'personal' | 'dinas' | 'all') || 'personal';
    const paginated = searchParams.get('paginated') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await listNotifications(
      session.user.id,
      category === 'all' ? undefined : category,
      limit,
      offset
    );

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
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const validated = markNotificationReadSchema.parse(body);

    await markNotificationsRead(session.user.id, validated.id);

    return NextResponse.json({ message: 'Berhasil menandai notifikasi sebagai telah dibaca' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Data tidak valid', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    const category = searchParams.get('category') as 'personal' | 'dinas' | 'all' | null;

    if (idStr) {
      const id = parseInt(idStr);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
      }
      await deleteNotifications(session.user.id, [id]);
    } else {
      await deleteNotifications(
        session.user.id,
        undefined,
        category && category !== 'all' ? category : undefined
      );
    }

    return NextResponse.json({ message: 'Berhasil menghapus notifikasi' });
  } catch (error: any) {
    console.error('Error in DELETE /api/notifications:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
