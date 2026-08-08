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

    // Jika sudah terverifikasi, hanya boleh edit no kamar, no hp, dan catatan
    const isVerified = existingContract.verificationStatus === 'verified';
    
    await updateTenantContract(contractId, {
      roomNumber: validatedData.roomNumber,
      individualPhone: validatedData.phone,
      notes: validatedData.notes,
      ...(isVerified ? {} : {
        individualName: validatedData.name,
        individualNik: validatedData.nik,
        individualGender: validatedData.gender,
        individualKtpFile: validatedData.ktpFile,
        checkInDate: validatedData.checkInDate,
      })
    });

    return NextResponse.json({ message: 'Data penyewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
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
