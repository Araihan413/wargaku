import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalResidentById,
  getRentalPropertyById,
  updateRentalResidentWithFamilySync,
  deleteRentalResidentWithCascade,
} from '@/db/queries/rental';
import { updateRentalResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

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

    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const hasVerifyPerm = await hasPermission(session.user.roleId, 'verify-documents');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !hasVerifyPerm && !isCoordinator) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

    const body = await request.json();

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
      updateData = body;
    } else {
      const safeBody = { ...body };
      if (
        body.verificationStatus === 'pending' &&
        (resident.verificationStatus === 'rejected' || resident.verificationStatus === 'pending')
      ) {
        safeBody.verificationStatus = 'pending';
        safeBody.verificationNote = null;
      } else {
        delete safeBody.verificationStatus;
        delete safeBody.verificationNote;
      }
      
      updateData = safeBody;
    }

    const validatedData = updateRentalResidentSchema.parse(updateData);

    await updateRentalResidentWithFamilySync(residentId, resident, validatedData, session.user.id);

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

    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke data penghuni ini' }, { status: 403 });
    }

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

    await deleteRentalResidentWithCascade(residentId, resident);

    return NextResponse.json({ message: 'Data penghuni berhasil dihapus' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-residents/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
