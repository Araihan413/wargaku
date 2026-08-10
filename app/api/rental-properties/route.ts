import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
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
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Pencarian nama properti
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const isKoordinatorKost = effectiveRoleId === 5;
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
 *         description: Properti sewa berhasil didaftarkan
 *       400:
 *         description: Validasi gagal atau properti sudah aktif di hunian ini
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

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
