import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, getRentalPropertyRooms } from '@/db/queries/rental';

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
      return NextResponse.json({ error: 'ID properti tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const roomItems = await getRentalPropertyRooms(propertyId, property);

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        dwellingId: property.dwellingId,
        blockNumber: property.dwelling?.blockNumber,
        houseNumber: property.dwelling?.houseNumber,
        type: property.dwelling?.type,
        qrToken: property.dwelling?.qrToken,
        totalRooms: property.totalRooms,
        contactPerson: property.contactPerson,
        phone: property.phone,
        notes: property.notes,
        coordinatorUserId: property.coordinatorUserId,
        ownerUserId: property.dwelling?.ownerUserId,
        ownerName: property.dwelling?.ownerName,
        isOwnerView: isOwner && !isCoordinator,
      },
      rooms: roomItems,
    });
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]/rooms:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
