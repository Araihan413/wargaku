import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { getDwellingDetailById } from '@/db/queries/population/dwelling.queries';

/**
 * @openapi
 * /api/dwellings/{id}/detail:
 *   get:
 *     summary: Mendapatkan detail lengkap hunian
 *     description: Mengambil data detail suatu hunian termasuk relasi Kepala Keluarga (jika permanen) atau properti sewa (jika kos/homestay). Membutuhkan akses admin/pengurus.
 *     tags:
 *       - Hunian
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID hunian
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan detail hunian
 *       400:
 *         description: ID Hunian tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Hunian tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await validateApiAuth('view-residents');
    if (errorResponse || !session) return errorResponse;

    const { id } = await params;
    const dwellingId = Number(id);

    if (isNaN(dwellingId)) {
      return NextResponse.json({ error: 'ID Hunian tidak valid' }, { status: 400 });
    }

    const detail = await getDwellingDetailById(dwellingId);

    if (!detail) {
      return NextResponse.json({ error: 'Hunian tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error: any) {
    console.error('Error in GET /api/dwellings/[id]/detail:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
