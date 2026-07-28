import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalResidentById,
  getRentalPropertyById,
} from '@/db/queries/rental';
import { updateRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (!resident.rentalPropertyId) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check authorization: RT/Admin (manage-boarding), coordinator, or owner
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
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

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (!resident.rentalPropertyId) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check authorization: RT/Admin (manage-boarding or verify-documents) or direct coordinator
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const hasVerifyPerm = await hasPermission(session.user.roleId, 'verify-documents');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !hasVerifyPerm && !isCoordinator) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    const body = await request.json();

    // If a coordinator attempts to edit verified data: check if they are changing sensitive fields
    if (isCoordinator && !hasVerifyPerm && resident.verificationStatus === 'verified') {
      const isNameChanged = body.name !== undefined && body.name !== resident.name;
      const isNikChanged = body.nik !== undefined && body.nik !== resident.nik;
      
      const incomingCheckIn = body.checkInDate ? new Date(body.checkInDate).getTime() : null;
      const existingCheckIn = resident.checkInDate ? new Date(resident.checkInDate).getTime() : null;
      const isCheckInChanged = incomingCheckIn !== null && incomingCheckIn !== existingCheckIn;
      
      const isKtpChanged = body.ktpFile !== undefined && body.ktpFile !== resident.ktpFile;

      if (isNameChanged || isNikChanged || isCheckInChanged || isKtpChanged) {
        return NextResponse.json(
          { error: 'Data identitas utama (Nama, NIK, Tanggal Check-In, KTP) sudah terverifikasi oleh RT dan tidak dapat diubah.' },
          { status: 403 }
        );
      }
    }

    let updateData: any;

    if (hasVerifyPerm) {
      // RT/Admin: Can change verification status
      updateData = body;
    } else {
      // Coordinator: Strip out verification columns to prevent self-approval
      const safeBody = { ...body };
      
      // Allow manual resubmit to RT: coordinator passes verificationStatus = 'pending'
      // and current resident status is rejected or pending
      if (
        body.verificationStatus === 'pending' &&
        (resident.verificationStatus === 'rejected' || resident.verificationStatus === 'pending')
      ) {
        safeBody.verificationStatus = 'pending';
        safeBody.verificationNote = null; // Clear verification note upon resubmission
      } else {
        delete safeBody.verificationStatus;
        delete safeBody.verificationNote;
      }
      
      updateData = safeBody;
    }

    const validatedData = updateRentalResidentSchema.parse(updateData);

    await db.transaction(async (tx) => {
      // 1. Update residents table entry
      await tx
        .update(schema.residents)
        .set({
          ...validatedData,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.residents.id, residentId));

      // 2. If family tenant, sync changes to families, familyMembers (residents), and users
      if (resident.tenantType === 'keluarga' && resident.familyId) {
        const [family] = await tx
          .select()
          .from(schema.families)
          .where(eq(schema.families.id, resident.familyId));

        if (family) {
          // Sync families
          const familyUpdates: any = { updatedAt: new Date() };
          if (validatedData.name) familyUpdates.headName = validatedData.name;
          if (validatedData.nik) familyUpdates.familyNumber = validatedData.nik;
          if (validatedData.roomNumber !== undefined) familyUpdates.unitNumber = validatedData.roomNumber || null;

          await tx
            .update(schema.families)
            .set(familyUpdates)
            .where(eq(schema.families.id, resident.familyId));

          // Sync head of family member in residents
          const memberUpdates: any = { updatedAt: new Date() };
          if (validatedData.name) memberUpdates.name = validatedData.name;
          if (validatedData.nik) memberUpdates.nik = validatedData.nik;
          if (validatedData.phone !== undefined) memberUpdates.phone = validatedData.phone || null;

          await tx
            .update(schema.residents)
            .set(memberUpdates)
            .where(
              and(
                eq(schema.residents.familyId, resident.familyId),
                eq(schema.residents.relationship, 'Kepala_Keluarga')
              )
            );

          // Sync users
          if (family.headUserId) {
            const userUpdates: any = { updatedAt: new Date() };
            if (validatedData.name) userUpdates.name = validatedData.name;
            if (validatedData.nik) userUpdates.nik = validatedData.nik;
            if (validatedData.phone !== undefined) userUpdates.phone = validatedData.phone || null;
            if (validatedData.roomNumber !== undefined) userUpdates.unitNumber = validatedData.roomNumber || null;

            await tx
              .update(schema.users)
              .set(userUpdates)
              .where(eq(schema.users.id, family.headUserId));
          }
        }
      }
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

    const { id } = await params;
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (!resident.rentalPropertyId) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const property = await getRentalPropertyById(resident.rentalPropertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check authorization: RT/Admin (manage-boarding) or direct coordinator
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    // Only pending or rejected status can be hard-deleted by coordinators
    if (
      isCoordinator &&
      !isGlobalAllowed &&
      resident.verificationStatus !== 'pending' &&
      resident.verificationStatus !== 'rejected'
    ) {
      return NextResponse.json(
        { error: 'Hanya data berstatus pending atau ditolak yang dapat dihapus oleh pengelola.' },
        { status: 403 }
      );
    }

    await db.transaction(async (tx) => {
      // Delete rental resident record
      await tx
        .delete(schema.residents)
        .where(eq(schema.residents.id, residentId));

      // If family tenant, cascade delete family, familyMembers (residents), accounts, and user account
      if (resident.tenantType === 'keluarga' && resident.familyId) {
        const [family] = await tx
          .select()
          .from(schema.families)
          .where(eq(schema.families.id, resident.familyId));

        // Delete family members from residents table
        await tx
          .delete(schema.residents)
          .where(and(eq(schema.residents.familyId, resident.familyId), eq(schema.residents.residentType, 'warga_tetap')));

        // Delete family
        await tx
          .delete(schema.families)
          .where(eq(schema.families.id, resident.familyId));

        if (family && family.headUserId) {
          // Delete account credentials
          await tx
            .delete(schema.accounts)
            .where(eq(schema.accounts.userId, family.headUserId));

          // Delete user account
          await tx
            .delete(schema.users)
            .where(eq(schema.users.id, family.headUserId));
        }
      }
    });

    return NextResponse.json({ message: 'Data penghuni berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
