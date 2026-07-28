import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/rental';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Check authorization: RT/Admin (manage-boarding), coordinator, or owner
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    // Parse rooms list from property
    let rooms: string[] = [];
    if (Array.isArray(property.roomList) && property.roomList.length > 0) {
      rooms = property.roomList as string[];
    } else {
      const total = property.totalRooms || 0;
      for (let i = 1; i <= total; i++) {
        rooms.push(i.toString().padStart(2, '0'));
      }
    }

    // Fetch active residents for this property
    const activeResidents = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        nik: schema.residents.nik,
        phone: schema.residents.phone,
        tenantType: schema.residents.residentType,
        roomNumber: schema.residents.roomNumber,
        checkInDate: schema.residents.checkInDate,
        verificationStatus: schema.residents.verificationStatus,
        verificationNote: schema.residents.verificationNote,
        ktpFile: schema.residents.ktpFile,
        originAddress: schema.residents.originAddress,
        occupation: schema.residents.occupation,
        educationLevel: schema.residents.educationLevel,
        religion: schema.residents.religion,
        isActive: schema.residents.isActive,
      })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.rentalPropertyId, propertyId),
          eq(schema.residents.isActive, true)
        )
      );

    // Group residents by room number
    const roomItems = rooms.map((roomNum) => {
      const roomResidentsRaw = activeResidents.filter(
        (r) => r.roomNumber === roomNum || (r.roomNumber === null && rooms.length === 1)
      );

      const roomResidents = roomResidentsRaw.map((r) => ({
        ...r,
        tenantType: r.tenantType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
      }));

      let status: 'vacant' | 'occupied' | 'sharing' = 'vacant';
      if (roomResidents.length === 1) {
        status = 'occupied';
      } else if (roomResidents.length > 1) {
        status = 'sharing';
      }

      return {
        roomNumber: roomNum,
        status,
        residentsCount: roomResidents.length,
        residents: roomResidents,
      };
    });

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
