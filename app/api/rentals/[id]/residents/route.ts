import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import {
  listTenantContracts,
  createTenantContract,
  createActivationTokenAndSendEmail,
} from '@/db/queries/property/tenant.queries';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rentals/{id}/residents:
 *   get:
 *     summary: Mendapatkan daftar penghuni Kos di satu properti
 *     description: Mengambil daftar kontrak/penghuni yang ada di dalam sebuah properti Kos.
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
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar penghuni
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listTenantContracts({
      rentalPropertyId: propertyId,
      limit,
      offset,
      isActive,
      query,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rentals/{id}/residents:
 *   post:
 *     summary: Mendaftarkan penghuni (kontrak sewa) baru di Kos
 *     description: Menambahkan penghuni ke dalam properti kos. Tipe keluarga bisa diundang (via email) atau dihubungkan jika keluarga sudah terdaftar.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantType
 *               - name
 *               - nik
 *               - checkInDate
 *             properties:
 *               roomNumber:
 *                 type: string
 *               tenantType:
 *                 type: string
 *                 enum: [individual, keluarga, family]
 *               name:
 *                 type: string
 *               nik:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               ktpFile:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               familyId:
 *                 type: integer
 *                 description: ID keluarga jika tipe keluarga dan sudah terdaftar (Opsional)
 *               userId:
 *                 type: string
 *                 description: User ID kepala keluarga (Opsional)
 *     responses:
 *       201:
 *         description: Penghuni sewa berhasil didaftarkan
 *       400:
 *         description: Validasi gagal atau email tidak diisi untuk tipe keluarga
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Properti tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isGlobalAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses untuk menambah penghuni di properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData: any = createRentalResidentSchema.parse(body);

    const checkInDate = new Date(validatedData.checkInDate);
    let contractId: number;

    if (validatedData.tenantType === 'keluarga' || validatedData.tenantType === 'family') {
      // === CASE 1: Keluarga Terdaftar (familyId langsung dari Autocomplete) ===
      if (validatedData.familyId) {
        contractId = await createTenantContract({
          rentalPropertyId: propertyId,
          tenantType: 'family',
          familyId: validatedData.familyId,
          userId: validatedData.userId ?? null,
          individualName: validatedData.name,
          individualNik: validatedData.nik,
          individualPhone: validatedData.phone,
          individualKtpFile: validatedData.ktpFile,
          checkInDate,
          autoDeductVacantRoom: validatedData.autoDeductVacantRoom,
        });

        return NextResponse.json({
          message: 'Penyewa Keluarga Terdaftar berhasil dihubungkan ke hunian sewa',
          id: contractId,
        }, { status: 201 });
      }

      // === CASE 2: Keluarga Baru (Email Undangan Brevo) ===
      if (!validatedData.email) {
        return NextResponse.json({ error: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga baru' }, { status: 400 });
      }

      contractId = await createTenantContract({
        rentalPropertyId: propertyId,
        tenantType: 'family',
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualPhone: validatedData.phone,
        individualKtpFile: validatedData.ktpFile,
        checkInDate,
        autoDeductVacantRoom: validatedData.autoDeductVacantRoom,
      });

      const requestOrigin = request.headers.get('origin') || undefined;
      await createActivationTokenAndSendEmail({
        email: validatedData.email,
        nik: validatedData.nik,
        rentalContractId: contractId,
        propertyName: property.name,
        userName: validatedData.name,
        requestOrigin,
      });

      return NextResponse.json({
        message: 'Penyewa Keluarga berhasil didaftarkan! Email undangan aktivasi telah dikirim.',
        id: contractId,
      }, { status: 201 });
    }

    // === PERORANGAN (Individu) ===
    contractId = await createTenantContract({
      rentalPropertyId: propertyId,
      tenantType: 'individual',
      individualName: validatedData.name,
      individualNik: validatedData.nik,
      individualPhone: validatedData.phone,
      individualKtpFile: validatedData.ktpFile,
      isKtpSameVillage: validatedData.isKtpSameVillage ?? false,
      ktpAddress: validatedData.ktpAddress ?? null,
      checkInDate,
      autoDeductVacantRoom: validatedData.autoDeductVacantRoom,
    });

    return NextResponse.json({ message: 'Penghuni sewa berhasil didaftarkan', id: contractId }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rentals/[id]/residents:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

