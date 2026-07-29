import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getRentalPropertyById,
  updateRentalProperty,
  deleteRentalProperty,
  isPropertyOwner,
} from '@/db/queries/rental';
import { getCoordinatorById, findOrCreatePendingCoordinatorByPhone } from '@/db/queries/coordinators';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { validateAndParseRoomPattern, generateDefaultRooms } from '@/lib/room-helper';

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
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    let coordinator = null;
    if (property.coordinatorUserId) {
      coordinator = await getCoordinatorById(property.coordinatorUserId);
    }

    return NextResponse.json({
      ...property,
      coordinator,
    });

  } catch (error: any) {
    console.error('Error in GET /api/my-properties/[id]:', error);
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
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateRentalPropertySchema.parse(body);

    if ('roomPattern' in body || 'totalRooms' in body) {
      let finalRoomList: string[] = [];
      const pattern = 'roomPattern' in body ? validated.roomPattern : property.roomPattern;
      
      if (pattern) {
        const parsed = validateAndParseRoomPattern(pattern);
        if (!parsed.isValid) {
          return NextResponse.json({ error: parsed.error }, { status: 400 });
        }
        finalRoomList = parsed.rooms;
        validated.totalRooms = finalRoomList.length;
      } else {
        const total = 'totalRooms' in body ? (validated.totalRooms ?? 0) : (property.totalRooms ?? 0);
        finalRoomList = generateDefaultRooms(total);
      }
      validated.roomList = finalRoomList;
    }

    let coordinatorId = validated.coordinatorUserId;
    
    if (!coordinatorId && body.coordinatorName && body.coordinatorPhone) {
      coordinatorId = await findOrCreatePendingCoordinatorByPhone(body.coordinatorName, body.coordinatorPhone);
    }

    await updateRentalProperty(propertyId, {
      ...validated,
      coordinatorUserId: coordinatorId,
    });

    return NextResponse.json({ message: 'Properti pribadi berhasil diperbarui' });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi input gagal' }, { status: 400 });
    }
    console.error('Error in PUT /api/my-properties/[id]:', error);
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
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    await deleteRentalProperty(propertyId);

    return NextResponse.json({ message: 'Properti pribadi berhasil dinonaktifkan' });

  } catch (error: any) {
    console.error('Error in DELETE /api/my-properties/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
