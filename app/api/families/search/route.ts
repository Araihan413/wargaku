import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { searchFamilyByExactKk } from '@/db/queries/population/family.queries';

/**
 * @openapi
 * /api/families/search:
 *   get:
 *     summary: Mencari data Kepala Keluarga
 *     description: Mencari data Kepala Keluarga berdasarkan Nomor KK yang persis cocok (16 digit) untuk mencegah pencarian acak/tebak-tebakan.
 *     tags:
 *       - Kepala Keluarga
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: kk
 *         schema:
 *           type: string
 *         required: true
 *         description: Nomor Kartu Keluarga (16 digit angka)
 *     responses:
 *       200:
 *         description: Berhasil mencari (mengembalikan objek status found true/false dan data ter-mask)
 *       400:
 *         description: Format nomor KK tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kk = searchParams.get('kk')?.replace(/\D/g, '') ?? '';

    if (kk.length !== 16) {
      return NextResponse.json({ error: 'Nomor KK harus 16 digit angka' }, { status: 400 });
    }

    const familyData = await searchFamilyByExactKk(kk);

    if (!familyData) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      data: familyData,
    });

  } catch (error: any) {
    console.error('Error in GET /api/families/search:', error);
    return NextResponse.json({ error: 'Kesalahan server internal' }, { status: 500 });
  }
}


