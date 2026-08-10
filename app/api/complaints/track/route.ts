import { NextResponse } from 'next/server';
import { getComplaintByTrackingCode } from '@/db/queries';

/**
 * @openapi
 * /api/complaints/track:
 *   get:
 *     summary: Melacak status pengaduan (Publik)
 *     description: Mengambil status dan detail laporan pengaduan berdasarkan kode tracking. Dapat diakses publik oleh pelapor.
 *     tags:
 *       - Pengaduan & Aspirasi
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Kode pelacakan (Tracking Code)
 *     responses:
 *       200:
 *         description: Berhasil mengambil detail pelacakan pengaduan
 *       400:
 *         description: Kode tracking tidak disertakan
 *       404:
 *         description: Pengaduan dengan kode tersebut tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json({ error: 'Kode tracking wajib diisi' }, { status: 400 });
    }

    const complaint = await getComplaintByTrackingCode(code);

    if (!complaint) {
      return NextResponse.json(
        { error: 'Laporan pengaduan dengan kode tracking tersebut tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: complaint },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in GET /api/complaints/track:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
