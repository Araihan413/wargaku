import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
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
    const { session, errorResponse } = await validateApiAuth('view-my-fees');
    if (errorResponse || !session) return errorResponse;

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
