import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { getNeighborhoodMap } from '@/db/queries/population/dwelling.queries';

/**
 * @openapi
 * /api/neighborhood:
 *   get:
 *     summary: Mendapatkan Peta Warga (Neighborhood Map)
 *     description: Mengambil daftar penghuni per blok/rumah untuk fitur Peta Warga. Data yang dikembalikan menyesuaikan izin (jika bukan pengurus, informasi NIK akan disensor).
 *     tags:
 *       - Modul Tambahan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data peta warga
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const isOfficer = await hasPermission(roleId, 'view-residents');
    const results = await getNeighborhoodMap(isOfficer);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in GET /api/neighborhood:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
