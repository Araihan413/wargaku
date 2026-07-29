import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { listRentalProperties, createRentalProperty, checkExistingActiveRental } from '@/db/queries/rental';
import { getDwellingOwner, claimDwellingOwner } from '@/db/queries/kependudukan';
import { findOrCreatePendingCoordinatorByPhone } from '@/db/queries/coordinators';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';
import { validateAndParseRoomPattern, generateDefaultRooms } from '@/lib/room-helper';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const result = await listRentalProperties({
      limit,
      offset,
      query,
      isActive,
      ownerUserId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/my-properties:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createRentalPropertySchema.parse(body);

    const dwelling = await getDwellingOwner(validated.dwellingId);

    if (!dwelling) {
      return NextResponse.json({ error: 'Tempat tinggal/dwelling tidak ditemukan' }, { status: 404 });
    }

    const hasActiveRental = await checkExistingActiveRental(validated.dwellingId);
    if (hasActiveRental) {
      return NextResponse.json({ error: 'Properti sewa aktif sudah terdaftar untuk hunian ini' }, { status: 400 });
    }

    if (!dwelling.ownerUserId) {
      await claimDwellingOwner(validated.dwellingId, session.user.id, session.user.name, session.user.phone);
    } else if (dwelling.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tempat tinggal/dwelling ini sudah dimiliki oleh warga lain' }, { status: 403 });
    }

    let coordinatorId = validated.coordinatorUserId || null;

    if (!coordinatorId && body.coordinatorName && body.coordinatorPhone) {
      coordinatorId = await findOrCreatePendingCoordinatorByPhone(body.coordinatorName, body.coordinatorPhone);
    }

    let finalRoomList: string[] = [];
    if (validated.roomPattern) {
      const parsed = validateAndParseRoomPattern(validated.roomPattern);
      if (!parsed.isValid) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      finalRoomList = parsed.rooms;
      validated.totalRooms = finalRoomList.length;
    } else {
      finalRoomList = generateDefaultRooms(validated.totalRooms);
    }

    const propertyId = await createRentalProperty({
      ...validated,
      coordinatorUserId: coordinatorId,
      roomList: finalRoomList,
    });

    return NextResponse.json({
      id: propertyId,
      coordinatorId: coordinatorId,
      message: 'Properti pribadi berhasil didaftarkan',
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validasi input gagal' }, { status: 400 });
    }
    console.error('Error in POST /api/my-properties:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
