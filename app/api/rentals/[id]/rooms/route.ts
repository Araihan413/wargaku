import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getRentalPropertyById,
  getRentalPropertyRooms,
} from '@/db/queries/property/rental-property.queries';

/**
 * @openapi
 * /api/rentals/{id}/rooms:
 *   get:
 *     summary: Mendapatkan status kamar di properti Kos
 *     description: Mengembalikan daftar kamar (berdasarkan totalRooms) beserta statusnya (terisi/kosong) dan data penyewa jika ada.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan status kamar
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const rooms = await getRentalPropertyRooms(propertyId, {
      totalRooms: property.totalRooms,
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/rooms:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
