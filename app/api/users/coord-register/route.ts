import { NextResponse } from 'next/server';
import { registerCoord } from '@/db/queries/auth/user.queries';
import { hashPassword } from 'better-auth/crypto';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

const nikRegex = /^[0-9]{16}$/;

/**
 * @openapi
 * /api/users/coord-register:
 *   post:
 *     summary: Menyelesaikan pendaftaran koordinator (Publik)
 *     description: Mendaftarkan akun koordinator kos/homestay menggunakan ID sementara, email, NIK, dan password. Endpoint ini bersifat publik dan dipanggil dari form registrasi koordinator.
 *     tags:
 *       - Pengguna
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - email
 *               - nik
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID sementara calon koordinator
 *               email:
 *                 type: string
 *               nik:
 *                 type: string
 *                 description: 16 digit NIK
 *               password:
 *                 type: string
 *                 description: Minimal 6 karakter
 *     responses:
 *       200:
 *         description: Registrasi koordinator berhasil diselesaikan
 *       400:
 *         description: Input tidak valid
 *       404:
 *         description: Calon koordinator tidak ditemukan atau sudah terregistrasi
 *       409:
 *         description: Email atau NIK sudah terdaftar
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, nik, password } = body;

    if (!id || !email || !nik || !password) {
      return NextResponse.json({ error: 'Seluruh kolom wajib diisi' }, { status: 400 });
    }

    if (!nikRegex.test(nik)) {
      return NextResponse.json({ error: 'NIK harus terdiri dari 16 digit angka' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal terdiri dari 6 karakter' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    await registerCoord(id, email, nik, hashedPassword);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: null,
      action: 'REGISTER_COORDINATOR',
      module: 'autentikasi',
      description: `Koordinator baru berhasil mendaftarkan akun: ${email} (NIK: ${nik}).`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Registrasi koordinator berhasil diselesaikan',
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
          { status: 404 }
        );
      }
      if (error.message === 'EMAIL_EXISTS') {
        return NextResponse.json({ error: 'Alamat email ini sudah terdaftar di sistem' }, { status: 409 });
      }
      if (error.message === 'NIK_EXISTS') {
        return NextResponse.json({ error: 'NIK ini sudah terdaftar di sistem' }, { status: 409 });
      }
    }
    console.error('Error in POST /api/users/coord-register:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
