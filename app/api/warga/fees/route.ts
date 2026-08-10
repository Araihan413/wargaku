import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getMyFamilyFees } from '@/db/queries';

/**
 * @openapi
 * /api/warga/fees:
 *   get:
 *     summary: Mendapatkan data iuran keluarga saya
 *     description: Mengambil data tagihan iuran bulanan untuk keluarga pengguna yang sedang login. Membutuhkan izin view-my-fees (biasanya Kepala Keluarga).
 *     tags:
 *       - Kependudukan
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data iuran keluarga
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
    const isAllowed = await hasPermission(effectiveRoleId, 'view-my-fees');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const feesData = await getMyFamilyFees(session.user.id);
    return NextResponse.json(feesData);
  } catch (error: any) {
    console.error('Error in GET /api/warga/fees:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
