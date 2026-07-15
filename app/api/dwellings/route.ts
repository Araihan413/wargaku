import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dwellings } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * @openapi
 * /api/dwellings:
 *   get:
 *     summary: Mendapatkan daftar hunian aktif untuk registrasi publik
 *     tags: [Hunian]
 *     responses:
 *       200:
 *         description: Daftar hunian berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   label:
 *                     type: string
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET() {
  try {
    const activeDwellings = await db
      .select({
        id: dwellings.id,
        streetName: dwellings.streetName,
        blockNumber: dwellings.blockNumber,
        houseNumber: dwellings.houseNumber,
      })
      .from(dwellings)
      .where(eq(dwellings.isActive, true));

    // Format label alamat untuk dropdown agar mudah dibaca warga
    const formattedData = activeDwellings.map((d) => {
      const parts = [
        d.streetName,
        d.blockNumber ? `Blok ${d.blockNumber}` : '',
        d.houseNumber ? `No. ${d.houseNumber}` : '',
      ].filter(Boolean);

      return {
        id: d.id,
        label: parts.join(' '),
      };
    });

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('Error in GET /api/dwellings:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
