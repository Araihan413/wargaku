import { NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/rbac';
import { listRentalProperties, createRentalProperty, checkExistingActiveRental } from '@/db/queries/property/rental-property.queries';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-properties:
 *   get:
 *     summary: Mendapatkan daftar semua properti sewa (Kos/Kontrakan)
 *     description: Mengambil daftar properti kos/kontrakan. Membutuhkan izin manage-boarding. Koordinator Kos (Role 5) hanya akan melihat properti yang ia kelola.
 *     tags:
 *       - Properti & Sewa
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
 *         description: Pencarian nama properti
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar properti sewa
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
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rental-properties:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-properties:
 *   post:
 *     summary: Mendaftarkan properti sewa baru (oleh Pengurus)
 *     description: Mendaftarkan hunian menjadi properti sewa (kos/kontrakan). Hanya dapat dilakukan oleh pengurus (Admin/RT) dengan izin manage-boarding.
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
 *               - phone
 *               - totalRooms
 *             properties:
 *               dwellingId:
 *                 type: integer
 *                 description: ID hunian yang dijadikan kos/kontrakan
 *               name:
 *                 type: string
 *                 description: Nama properti kos
 *               coordinatorUserId:
 *                 type: string
 *                 nullable: true
 *                 description: ID user penanggung jawab/koordinator kos
 *               contactPerson:
 *                 type: string
 *                 description: Nama kontak pengelola
 *               phone:
 *                 type: string
 *                 description: Nomor telepon pengelola
 *               totalRooms:
 *                 type: integer
 *                 description: Total kapasitas kamar
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Catatan tambahan mengenai properti
 *     responses:
 *       201:
 *         description: Properti sewa berhasil dibuat
 *       400:
 *         description: Validasi input gagal atau hunian sudah terdaftar sebagai properti sewa aktif
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
      notes: validatedData.notes || undefined,
    });

    return NextResponse.json(
      { message: 'Properti Kontrakan/Kos berhasil didaftarkan', id: propertyId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rental-properties:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
