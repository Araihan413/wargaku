import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { listCoordinators, createCoordinator, createCoordinatorSchema } from '@/db/queries';
import { z } from 'zod';
import { notifyUser } from '@/lib/notifications';

/**
 * @openapi
 * /api/coordinators:
 *   get:
 *     summary: Mendapatkan daftar koordinator
 *     description: Mengambil daftar pengguna yang memiliki role sebagai koordinator (seperti Koordinator Kos).
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar koordinator
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed =
      (await hasPermission(effectiveRoleId, 'view-residents')) ||
      (await hasPermission(effectiveRoleId, 'view-dwelling-details')) ||
      (await hasPermission(effectiveRoleId, 'manage-dwellings'));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const coordinators = await listCoordinators();

    return NextResponse.json(coordinators);
  } catch (error: any) {
    console.error('Error in GET /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/coordinators:
 *   post:
 *     summary: Menambah atau menetapkan koordinator
 *     description: Mendaftarkan atau menugaskan pengguna menjadi koordinator suatu properti. Jika email baru, akan otomatis membuat akun.
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Koordinator berhasil ditambahkan/diperbarui
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Pengguna tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createCoordinatorSchema.parse(body);

    const { targetUserId, isNewUserCreated, generatedPassword, emailSentSuccessfully } =
      await createCoordinator(validated);

    if (targetUserId) {
      notifyUser(targetUserId, {
        title: "Penugasan Koordinator Kost",
        message: "Anda telah ditugaskan atau diperbarui sebagai Koordinator Kost oleh Pengurus RT.",
        category: "personal",
        redirectLink: "/dashboard",
      }).catch((err) => console.error("Gagal kirim notifikasi koordinator:", err));
    }

    let responseMessage = "Koordinator kos berhasil ditambahkan/diperbarui.";
    if (isNewUserCreated) {
      responseMessage = emailSentSuccessfully
        ? `Akun koordinator kos berhasil dibuat. Email aktivasi dengan password sementara (${generatedPassword}) telah dikirim ke ${validated.email}.`
        : `Akun koordinator kos berhasil dibuat. Password sementara: ${generatedPassword} (Gagal mengirim email, berikan password ini secara manual).`;
    }

    return NextResponse.json({
      message: responseMessage,
      targetUserId,
      isNewUserCreated,
      temporaryPassword: generatedPassword || undefined,
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pengguna yang dipilih tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in POST /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
