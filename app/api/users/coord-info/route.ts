import { NextResponse } from 'next/server';
import { getPendingCoordInfo } from '@/db/queries/auth/user.queries';

/**
 * @openapi
 * /api/users/coord-info:
 *   get:
 *     summary: Mendapatkan informasi calon koordinator (Publik)
 *     description: Mengambil data nama dan nomor telepon calon koordinator berdasarkan ID sementara (ID dari undangan pendaftaran). Endpoint ini bersifat publik dan digunakan di halaman registrasi koordinator.
 *     tags:
 *       - Pengguna
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID sementara calon koordinator
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan informasi calon koordinator
 *       400:
 *         description: ID tidak valid
 *       404:
 *         description: Calon koordinator tidak ditemukan atau sudah terregistrasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const user = await getPendingCoordInfo(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Calon koordinator tidak ditemukan atau sudah terregistrasi' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
    });
  } catch (error: any) {
    console.error('Error in GET /api/users/coord-info:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
