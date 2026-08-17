import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import {
  getTenantContractById,
  updateTenantContract,
  deleteTenantContract,
} from '@/db/queries/property/tenant.queries';
import { getRentalPropertyById } from '@/db/queries/property/rental-property.queries';
import { updateRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { notifyUser } from '@/lib/notifications';

/**
 * @openapi
 * /api/rental-residents/{id}:
 *   get:
 *     summary: Mendapatkan detail penghuni (kontrak sewa)
 *     description: Mengambil data detail satu kontrak penghuni sewa berdasarkan ID.
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
 *         description: Berhasil mendapatkan detail penghuni
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Kontrak sewa tidak ditemukan
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
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const contract = await getTenantContractById(contractId);
    if (!contract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error: any) {
    console.error('Error in GET /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-residents/{id}:
 *   put:
 *     summary: Memperbarui data atau status verifikasi penyewa kos
 *     description: Mengubah data kontrak penghuni atau memproses persetujuan/penolakan verifikasi oleh RT.
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
 *             properties:
 *               roomNumber:
 *                 type: string
 *               phone:
 *                 type: string
 *               notes:
 *                 type: string
 *               verificationStatus:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *               verificationNote:
 *                 type: string
 *               name:
 *                 type: string
 *               nik:
 *                 type: string
 *               ktpFile:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Data penyewa berhasil diperbarui
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Belum terautentikasi
 *       404:
 *         description: Kontrak sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function PUT(
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
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingContract = await getTenantContractById(contractId);
    if (!existingContract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData: any = updateRentalResidentSchema.parse(body);

    // Jika sudah terverifikasi, hanya boleh edit no hp dan catatan (kecuali sedang memproses verifikasi itu sendiri)
    const isVerified = existingContract.verificationStatus === 'verified' && !validatedData.verificationStatus;
    
    await updateTenantContract(contractId, {
      individualPhone: validatedData.phone,
      notes: validatedData.notes,
      verificationStatus: validatedData.verificationStatus,
      verificationNote: validatedData.verificationNote,
      ...(isVerified ? {} : {
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualKtpFile: validatedData.ktpFile,
        isKtpSameVillage: validatedData.isKtpSameVillage,
        ktpAddress: validatedData.ktpAddress,
        checkInDate: validatedData.checkInDate,
      })
    });

    // Kirim notifikasi lonceng ke Koordinator Kos jika status verifikasi diubah oleh RT
    if (
      validatedData.verificationStatus &&
      validatedData.verificationStatus !== existingContract.verificationStatus
    ) {
      const property = await getRentalPropertyById(existingContract.rentalPropertyId).catch(() => null);
      if (property?.coordinatorUserId && property.coordinatorUserId !== session.user.id) {
        const isApproved = validatedData.verificationStatus === 'verified';
        const tenantName = validatedData.name || existingContract.individualName || 'Penghuni Kos';
        
        notifyUser(property.coordinatorUserId, {
          title: 'Status Verifikasi Penghuni Kos',
          message: isApproved
            ? `Pengajuan verifikasi penyewa "${tenantName}" di ${property.name} telah DISETUJUI oleh RT.`
            : `Pengajuan verifikasi penyewa "${tenantName}" di ${property.name} telah DITOLAK oleh RT.${validatedData.verificationNote ? ` Catatan: ${validatedData.verificationNote}` : ''}`,
          category: 'personal',
          redirectLink: '/dashboard/my-properties',
        }).catch((err: any) => console.error('Gagal mengirim notifikasi verifikasi kos:', err));
      }
    }

    return NextResponse.json({ message: 'Data penyewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/rental-residents/{id}:
 *   delete:
 *     summary: Menghapus permanen kontrak penyewa
 *     description: Menghapus data kontrak penghuni dari sistem secara permanen. Hanya bisa dilakukan oleh Admin/RT atau Koordinator properti tersebut.
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
 *         description: Kontrak penyewa berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses
 *       404:
 *         description: Kontrak sewa atau properti kos tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 */
export async function DELETE(
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
    const contractId = Number(id);

    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingContract = await getTenantContractById(contractId);
    if (!existingContract) {
      return NextResponse.json({ error: 'Kontrak sewa tidak ditemukan' }, { status: 404 });
    }

    // Otorisasi Akses
    const property = await getRentalPropertyById(existingContract.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti kos tidak ditemukan' }, { status: 404 });
    }

    const isCoordinator = session.user.id === property.coordinatorUserId;
    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAdmin = await hasPermission(effectiveRoleId, 'manage-residents') || await hasPermission(effectiveRoleId, 'manage-boarding');

    if (!isCoordinator && !isAdmin) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses untuk menghapus kontrak ini' }, { status: 403 });
    }

    await deleteTenantContract(contractId);

    return NextResponse.json({ message: 'Kontrak penyewa berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
