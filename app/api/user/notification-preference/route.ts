import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @openapi
 * /api/user/notification-preference:
 *   get:
 *     summary: Mendapatkan preferensi notifikasi pengguna
 *     description: Mengambil status pengaktifan notifikasi push (OneSignal) milik pengguna yang sedang login.
 *     tags:
 *       - Pengguna
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil preferensi
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 *   patch:
 *     summary: Memperbarui preferensi notifikasi pengguna
 *     description: Mengubah status pushNotificationsEnabled (true/false) untuk pengguna yang sedang login.
 *     tags:
 *       - Pengguna
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pushNotificationsEnabled
 *             properties:
 *               pushNotificationsEnabled:
 *                 type: boolean
 *                 description: Status aktifkan push notification
 *     responses:
 *       200:
 *         description: Berhasil memperbarui preferensi
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const [user] = await db
      .select({
        pushNotificationsEnabled: users.pushNotificationsEnabled,
      })
      .from(users)
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      pushNotificationsEnabled: user?.pushNotificationsEnabled ?? true,
    });
  } catch (error: any) {
    console.error('Error in GET /api/user/notification-preference:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
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
    const { pushNotificationsEnabled } = body;

    if (typeof pushNotificationsEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Nilai pushNotificationsEnabled harus berupa boolean' },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        pushNotificationsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: 'Preferensi notifikasi berhasil diperbarui',
      pushNotificationsEnabled,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/user/notification-preference:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
