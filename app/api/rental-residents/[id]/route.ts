import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalResidentById,
  getRentalPropertyById,
  updateRentalResident,
  deleteRentalResident,
} from '@/db/queries/rental';
import { updateRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

/**
 * @openapi
 * /api/rental-residents/{id}:
 *   get:
 *     summary: Mendapatkan detail lengkap data penghuni sewa (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Penghuni Sewa
 *     responses:
 *       200:
 *         description: Detail data penghuni sewa berhasil diambil
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses ke data penghuni ini
 *       404:
 *         description: Penghuni atau properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   put:
 *     summary: Memperbarui data penghuni sewa / verifikasi dokumen (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Penghuni Sewa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantType:
 *                 type: string
 *                 enum: [perorangan, keluarga]
 *               name:
 *                 type: string
 *               nik:
 *                 type: string
 *               phone:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               familyCardFile:
 *                 type: string
 *               identityCardFile:
 *                 type: string
 *               employmentCertificateFile:
 *                 type: string
 *               marriageCertificateFile:
 *                 type: string
 *               verificationStatus:
 *                 type: string
 *                 enum: [pending, verified, rejected]
 *                 description: Status verifikasi dokumen (Hanya dapat diubah oleh Pengurus RT/Admin)
 *               verificationNote:
 *                 type: string
 *                 description: Catatan verifikasi dokumen (Hanya dapat diubah oleh Pengurus RT/Admin)
 *     responses:
 *       200:
 *         description: Data penghuni berhasil diperbarui
 *       400:
 *         description: Validasi input gagal atau ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Terkunci (status verified) untuk Koordinator Kost, atau tidak memiliki izin akses
 *       404:
 *         description: Penghuni atau properti sewa tidak ditemukan
 *       500:
 *         description: Kesalahan server internal
 *   delete:
 *     summary: Menghapus data pendaftaran penghuni sewa / Hard Delete (Pengurus & Koordinator Kost Pemilik)
 *     tags: [Penghuni Sewa]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Penghuni Sewa
 *     responses:
 *       200:
 *         description: Data pendaftaran penghuni berhasil dihapus
 *       400:
 *         description: ID tidak valid
 *       401:
 *         description: Belum terautentikasi
 *       403:
 *         description: Tidak memiliki izin akses, atau data bukan berstatus pending (jika diakses Koordinator Kost)
 *       404:
 *         description: Penghuni atau properti sewa tidak ditemukan
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Cek otorisasi kepemilikan untuk Koordinator Kost
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    return NextResponse.json(resident);
  } catch (error: any) {
    console.error('Error in GET /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const hasVerifyPerm = await hasPermission(session.user.roleId, 'verify-documents');

    if (!isAllowed && !hasVerifyPerm) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isKoordinatorKost = session.user.roleId === 5;
    
    // Cek otorisasi kepemilikan untuk Koordinator Kost
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    // Jika Koordinator Kost mencoba mengedit data yang sudah verified
    if (isKoordinatorKost && resident.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Data penyewa yang terverifikasi dikunci. Silakan hubungi pengurus RT untuk melakukan perubahan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let updateData: any;

    if (hasVerifyPerm) {
      // RT/Admin: Bisa mengubah status verifikasi
      updateData = body;
    } else {
      // Koordinator Kost / Pengguna Lain: Hapus kolom verifikasi
      const safeBody = { ...body };
      delete safeBody.verificationStatus;
      delete safeBody.verificationNote;
      updateData = safeBody;
    }

    const validatedData = updateRentalResidentSchema.parse(updateData);
    await updateRentalResident(residentId, {
      ...validatedData,
      updatedBy: session.user.id,
    });

    return NextResponse.json({ message: 'Data penghuni berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const hasVerifyPerm = await hasPermission(session.user.roleId, 'verify-documents');

    if (!isAllowed && !hasVerifyPerm) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isKoordinatorKost = session.user.roleId === 5;

    // Cek otorisasi kepemilikan untuk Koordinator Kost
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    // Hanya status pending yang boleh di-hard delete oleh Koordinator Kost
    if (isKoordinatorKost && resident.verificationStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Hanya data berstatus pending yang dapat dihapus.' },
        { status: 403 }
      );
    }

    await deleteRentalResident(residentId);

    return NextResponse.json({ message: 'Data penghuni berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
