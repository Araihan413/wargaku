import { NextResponse } from 'next/server';
import { validateApiAuth, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import {
  listTenantContracts,
  createTenantContract,
  createFamilyTenantWithUser,
  terminateTenantContract,
  getTenantContractById,
} from '@/db/queries/property/tenant.queries';
import { createRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { notifyRoles } from '@/lib/notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from '@/lib/audit-logger';

/**
 * @openapi
 * /api/rental-contracts:
 *   get:
 *     summary: Mendapatkan daftar kontrak sewa (penghuni sewa)
 *     description: Mengambil daftar penghuni (tenant contracts) berdasarkan properti sewa. Membutuhkan izin view-residents atau menjadi Koordinator/Pemilik properti tersebut.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: rentalPropertyId
 *         schema:
 *           type: integer
 *         description: ID Properti Sewa
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar penghuni sewa
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke data penghuni properti ini
 *       500:
 *         description: Kesalahan server internal
 */
export async function GET(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('rentalPropertyId') || searchParams.get('propertyId');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const propertyId = propertyIdParam ? Number(propertyIdParam) : 0;

    // CEL-04: Validasi kepemilikan / RBAC sebelum kembalikan data penyewa
    const isGlobalOfficer = await hasPermission(roleId, 'manage-boarding');
    const hasViewPerm = await hasPermission(roleId, 'view-residents');

    if (!isGlobalOfficer && !hasViewPerm && propertyId > 0) {
      // Warga/koordinator hanya boleh lihat properti miliknya sendiri
      const property = await getRentalPropertyById(propertyId);
      const isCoordinator = property?.coordinatorUserId === session.user.id;
      const isOwner = property?.dwelling?.ownerUserId === session.user.id;

      if (!isCoordinator && !isOwner) {
        return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni properti ini' }, { status: 403 });
      }
    }

    const result = await listTenantContracts({
      rentalPropertyId: propertyId,
      limit,
      offset,
      isActive,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rental-contracts:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-contracts:
 *   post:
 *     summary: Mendaftarkan penghuni (kontrak sewa) baru
 *     description: Menambahkan penghuni baru ke dalam properti sewa. Jika tipe sewa adalah keluarga, maka akan otomatis membuat akun user dan keluarga baru.
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
 *               - rentalPropertyId
 *               - tenantType
 *               - name
 *               - nik
 *               - checkInDate
 *             properties:
 *               rentalPropertyId:
 *                 type: integer
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
 *                 description: Wajib untuk tipe sewa keluarga
 *               ktpFile:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Penghuni sewa berhasil didaftarkan
 *       400:
 *         description: Validasi gagal atau email kepala keluarga tidak diisi
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses untuk menambah penghuni di properti ini
 *       404:
 *         description: Properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function POST(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const body = await request.json();
    const validatedData: any = createRentalResidentSchema.parse(body);

    const rentalPropId = validatedData.rentalPropertyId || validatedData.dwellingId;
    const property = await getRentalPropertyById(rentalPropId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isGlobalAllowed = await hasPermission(roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses untuk menambah penghuni di properti ini' }, { status: 403 });
    }

    const checkInDate = new Date(validatedData.checkInDate);
    let contractId: number;

    if (validatedData.tenantType === 'keluarga' || validatedData.tenantType === 'family') {
      if (!validatedData.email) {
        return NextResponse.json({ error: 'Email Kepala Keluarga wajib diisi untuk tipe sewa keluarga' }, { status: 400 });
      }

      const requestOrigin = request.headers.get('origin') || undefined;
      contractId = await createFamilyTenantWithUser(
        {
          rentalPropertyId: rentalPropId,
          tenantType: 'family',
          name: validatedData.name,
          email: validatedData.email,
          nik: validatedData.nik,
          phone: validatedData.phone,
          dwellingId: property.dwellingId,
          checkInDate,
          autoDeductVacantRoom: validatedData.autoDeductVacantRoom,
        },
        requestOrigin
      );
    } else {
      contractId = await createTenantContract({
        rentalPropertyId: rentalPropId,
        tenantType: 'individual',
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualPhone: validatedData.phone,
        individualKtpFile: validatedData.ktpFile,
        checkInDate,
        autoDeductVacantRoom: validatedData.autoDeductVacantRoom,
      });
    }

    await notifyRoles(['1', '2'], {
      title: 'Pendaftaran Penghuni Kos Baru',
      message: `Penghuni baru (${validatedData.name}) telah didaftarkan di ${property.name}.`,
      redirectLink: '/dashboard/rentals',
    });

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'CREATE_RENTAL_CONTRACT',
      module: 'sewa',
      description: `Mendaftarkan penghuni baru: ${validatedData.name} (NIK: ${validatedData.nik}) di properti ${property.name}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json(
      { message: 'Penghuni sewa berhasil didaftarkan', contractId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/rental-contracts:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-contracts:
 *   delete:
 *     summary: Mengakhiri kontrak sewa penghuni (Check-Out)
 *     description: Mengakhiri masa sewa penghuni pada properti. Jika tipe keluarga, status rumah akan dikembalikan menjadi kosong.
 *     tags:
 *       - Properti & Sewa
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kontrak Sewa (Tenant Contract ID)
 *     responses:
 *       200:
 *         description: Kontrak sewa berhasil diakhiri
 *       400:
 *         description: ID Kontrak wajib diisi
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin untuk mengakhiri kontrak sewa ini
 *       404:
 *         description: Kontrak sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(request: Request) {
  try {
    const { session, roleId, errorResponse } = await validateApiAuth();
    if (errorResponse || !session) return errorResponse;

    const { searchParams } = new URL(request.url);
    const contractIdParam = searchParams.get('id');

    if (!contractIdParam) {
      return NextResponse.json({ error: 'ID Kontrak wajib diisi' }, { status: 400 });
    }

    const contractId = Number(contractIdParam);

    // CEL-05: Validasi kepemilikan sebelum terminate kontrak
    const contract = await getTenantContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    const isGlobalOfficer = await hasPermission(roleId, 'manage-boarding');

    if (!isGlobalOfficer) {
      const property = await getRentalPropertyById(contract.rentalPropertyId);
      const isCoordinator = property?.coordinatorUserId === session.user.id;
      const isOwner = property?.dwelling?.ownerUserId === session.user.id;

      if (!isCoordinator && !isOwner) {
        return NextResponse.json({ error: 'Tidak memiliki izin untuk mengakhiri kontrak sewa ini' }, { status: 403 });
      }
    }

    await terminateTenantContract(contractId);

    const ipAddress = await getClientIp(request);
    createAuditLog({
      userId: session.user.id,
      action: 'TERMINATE_RENTAL_CONTRACT',
      module: 'sewa',
      description: `Mengakhiri kontrak sewa ID #${contractId}.`,
      ipAddress,
    }).catch(() => null);

    return NextResponse.json({ message: 'Kontrak sewa berhasil diakhiri' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-contracts:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
