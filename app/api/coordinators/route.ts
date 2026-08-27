import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { listCoordinators, createCoordinator, createCoordinatorSchema } from '@/db/queries';
import { ZodError } from 'zod';
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
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const isAllowed =
      (await hasPermission(roleId, 'view-residents')) ||
      (await hasPermission(roleId, 'view-dwelling-details')) ||
      (await hasPermission(roleId, 'manage-dwellings'));

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
 *     summary: Menambahkan atau memperbarui koordinator
 *     description: Menugaskan pengguna yang sudah ada atau membuat akun pengguna baru sebagai koordinator kos. Memerlukan izin manage-dwellings.
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
    const { session, errorResponse } = await validateApiAuth('manage-dwellings');
    if (errorResponse || !session) return errorResponse;

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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Input tidak valid' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Pengguna yang dipilih tidak ditemukan' }, { status: 404 });
    }
    console.error('Error in POST /api/coordinators:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
