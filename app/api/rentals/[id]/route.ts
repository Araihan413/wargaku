import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById, updateRentalProperty, deleteRentalProperty, cleanupOldCoordinatorStatus } from '@/db/queries/rental';
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
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

    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    return NextResponse.json(property);
  } catch (error: any) {
    console.error('Error in GET /api/rentals/[id]:', error);
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

    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const oldCoordinatorId = property.coordinatorUserId;

    if (isKoordinatorKost) {
      body.coordinatorUserId = session.user.id;
    }

    const validatedData = updateRentalPropertySchema.parse(body);

    if ('roomPattern' in body || 'totalRooms' in body) {
      let finalRoomList: string[] = [];
      const pattern = 'roomPattern' in body ? validatedData.roomPattern : property.roomPattern;
      
      if (pattern) {
        const parsed = validateAndParseRoomPattern(pattern);
        if (!parsed.isValid) {
          return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        finalRoomList = parsed.rooms;
        validatedData.totalRooms = finalRoomList.length;
      } else {
        const total = 'totalRooms' in body ? (validatedData.totalRooms ?? 0) : (property.totalRooms ?? 0);
        finalRoomList = generateDefaultRooms(total);
      }
      validatedData.roomList = finalRoomList;
    }

    await updateRentalProperty(propertyId, validatedData);

    if (oldCoordinatorId && validatedData.coordinatorUserId !== oldCoordinatorId) {
      await cleanupOldCoordinatorStatus(oldCoordinatorId);
    }

    return NextResponse.json({ message: 'Informasi properti sewa berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in PUT /api/rentals/[id]:', error);
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

    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost && property.coordinatorUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses ke properti ini' }, { status: 403 });
    }

    await deleteRentalProperty(propertyId);

    return NextResponse.json({ message: 'Properti sewa berhasil dinonaktifkan' });
  } catch (error: any) {
    console.error('Error in DELETE /api/rentals/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
