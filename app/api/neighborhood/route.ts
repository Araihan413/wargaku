import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isOfficer = await hasPermission(effectiveRoleId, 'view-residents');

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
