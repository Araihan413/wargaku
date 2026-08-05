import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getEffectiveRoleId, hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, updateRentalProperty, deleteRentalProperty, cleanupOldCoordinatorRole } from '@/db/queries/property/rental-property.queries';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { validateAndParseRoomPattern, generateDefaultRooms } from '@/lib/room-helper';
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isKoordinatorKost = effectiveRoleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Error in GET /api/rental-properties/[id]:', error);
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingProperty = await getRentalPropertyById(propertyId);
    if (!existingProperty) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    const isKoordinatorKost = effectiveRoleId === 5;
    if (isKoordinatorKost && existingProperty.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateRentalPropertySchema.parse(body);

    let finalRoomList = validatedData.roomList;
    if (validatedData.roomPattern) {
      const parsed = validateAndParseRoomPattern(validatedData.roomPattern);
      if (parsed?.rooms) {
        finalRoomList = parsed.rooms;
      }
    }

    if (!finalRoomList || finalRoomList.length === 0) {
      if (validatedData.totalRooms && validatedData.totalRooms > 0) {
        finalRoomList = generateDefaultRooms(validatedData.totalRooms);
      }
    }

    const previousCoordinatorUserId = existingProperty.coordinatorUserId;

    await updateRentalProperty(propertyId, {
      name: validatedData.name,
      coordinatorUserId: validatedData.coordinatorUserId || undefined,
      contactPerson: validatedData.contactPerson,
      phone: validatedData.phone,
      totalRooms: validatedData.totalRooms,
      notes: validatedData.notes || undefined,
      roomPattern: validatedData.roomPattern,
      roomList: finalRoomList,
      isActive: validatedData.isActive,
    });

    if (previousCoordinatorUserId && previousCoordinatorUserId !== validatedData.coordinatorUserId) {
      await cleanupOldCoordinatorRole(previousCoordinatorUserId);
    }

    return NextResponse.json({ message: 'Properti sewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/rental-properties/[id]:', error);
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

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const existingProperty = await getRentalPropertyById(propertyId);
    if (!existingProperty) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    await deleteRentalProperty(propertyId);

    if (existingProperty.coordinatorUserId) {
      await cleanupOldCoordinatorRole(existingProperty.coordinatorUserId);
    }

    return NextResponse.json({ message: 'Properti sewa berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rental-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
