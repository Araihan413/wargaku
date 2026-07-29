import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import {
  getRentalResidentById,
  getRentalPropertyById,
  reactivateRentalResidentWithCascade,
} from '@/db/queries/rental';

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

    if (resident.isActive) {
      return NextResponse.json({ error: 'Penyewa sudah dalam status aktif' }, { status: 400 });
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
      return NextResponse.json(
        { error: 'Hanya pengelola (koordinator) atau pengurus RT yang dapat mengaktifkan kembali penyewa' },
        { status: 403 }
      );
    }

    await reactivateRentalResidentWithCascade(residentId, resident, session.user.id);

    return NextResponse.json({ message: 'Penyewa berhasil diaktifkan kembali' });
  } catch (error: any) {
    console.error('Error in POST /api/rental-residents/[id]/reactivate:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
