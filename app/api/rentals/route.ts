import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import {
  listRentalProperties,
  createRentalProperty,
  checkExistingActiveRental,
} from '@/db/queries/property/rental-property.queries';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rentals:
 *   get:
 *     summary: Mendapatkan daftar Properti Kos/Kontrakan
 *     description: Mengambil daftar properti sewa (kos/kontrakan). Hanya untuk admin/pengurus.
 *     tags:
 *       - Hunian Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Batas jumlah data
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset paginasi
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Pencarian nama/pemilik properti
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar properti sewa
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth('manage-boarding');
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const isKoordinatorKost = roleId === 5;
    const coordinatorUserId = isKoordinatorKost ? session.user.id : undefined;

    const result = await listRentalProperties({
      limit,
      offset,
      query,
      isActive,
      coordinatorUserId,
      dwellingType: 'kos',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rentals:
 *   post:
 *     summary: Mendaftarkan properti sewa Kos baru (oleh Pengurus)
 *     description: Mendaftarkan hunian menjadi properti sewa. Sama seperti endpoint /api/rental-properties.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dwellingId
 *               - name
 *             properties:
 *               dwellingId:
 *                 type: integer
 *               name:
 *                 type: string
 *               coordinatorUserId:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               phone:
 *                 type: string
 *               totalRooms:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Properti kos berhasil didaftarkan
 *       400:
 *         description: Validasi gagal atau properti aktif sudah ada di hunian ini
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, errorResponse } = await validateApiAuth('manage-boarding');
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validatedData = createRentalPropertySchema.parse(body);

    const isAlreadyRental = await checkExistingActiveRental(validatedData.dwellingId);
    if (isAlreadyRental) {
      return NextResponse.json(
        { error: 'Rumah/Hunian ini sudah terdaftar sebagai Properti Kontrakan/Kos aktif' },
        { status: 400 }
      );
    }

    const propertyId = await createRentalProperty({
      dwellingId: validatedData.dwellingId,
      name: validatedData.name,
      coordinatorUserId: validatedData.coordinatorUserId ?? undefined,
      contactPerson: validatedData.contactPerson || '',
      phone: validatedData.phone,
      totalRooms: validatedData.totalRooms,
      notes: validatedData.notes,
    });

    return NextResponse.json(
      { message: 'Properti sewa berhasil dibuat', id: propertyId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rentals:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
