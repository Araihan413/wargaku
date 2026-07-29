import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalResidentById,
  getRentalPropertyById,
  checkOutRentalResidentWithCascade,
} from '@/db/queries/rental';
import { checkOutResidentSchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { getFamilyById } from '@/db/queries/kependudukan';

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
    const residentId = Number(id);

    if (isNaN(residentId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const resident = await getRentalResidentById(residentId);
    if (!resident) {
      return NextResponse.json({ error: 'Penghuni tidak ditemukan' }, { status: 404 });
    }

    if (resident.tenantType === 'keluarga' && resident.familyId) {
      const family = await getFamilyById(resident.familyId);
      if (!family || family.verificationStatus !== 'verified') {
        return NextResponse.json(
          { error: 'Penyewa keluarga yang belum terverifikasi oleh RT tidak dapat melakukan check-out' },
          { status: 400 }
        );
      }
    } else if (resident.verificationStatus !== 'verified') {
      return NextResponse.json(
        { error: 'Penyewa dengan status pending/ditolak tidak dapat melakukan check-out' },
        { status: 400 }
      );
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
      return NextResponse.json({ error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat memproses check-out' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = checkOutResidentSchema.parse(body);

    await checkOutRentalResidentWithCascade(residentId, resident, validatedData, session.user.id);

    return NextResponse.json({ message: 'Penyewa berhasil check-out' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rental-residents/[id]/check-out:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
