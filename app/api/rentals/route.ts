import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { listRentalProperties, createRentalProperty, checkExistingActiveRental } from '@/db/queries/rental';
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;
    const query = searchParams.get('query') || undefined;
    
    let isActive: boolean | undefined = undefined;
    if (searchParams.get('isActive') !== null) {
      isActive = searchParams.get('isActive') === 'true';
    }

    const isKoordinatorKost = session.user.roleId === 5;
    const coordinatorUserId = isKoordinatorKost ? session.user.id : undefined;

    const result = await listRentalProperties({
      limit,
      offset,
      query,
      isActive,
      coordinatorUserId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/rentals:', error);
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

    const isAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const body = await request.json();
    
    const isKoordinatorKost = session.user.roleId === 5;
    if (isKoordinatorKost) {
      body.coordinatorUserId = Number(session.user.id);
    }

    const validatedData = createRentalPropertySchema.parse(body);

    const hasExistingRental = await checkExistingActiveRental(validatedData.dwellingId);
    if (hasExistingRental) {
      return NextResponse.json({ error: 'Properti sewa aktif sudah terdaftar untuk hunian ini' }, { status: 400 });
    }

    let finalRoomList: string[] = [];
    if (validatedData.roomPattern) {
      const parsed = validateAndParseRoomPattern(validatedData.roomPattern);
      if (!parsed.isValid) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      finalRoomList = parsed.rooms;
      validatedData.totalRooms = finalRoomList.length;
    } else {
      finalRoomList = generateDefaultRooms(validatedData.totalRooms);
    }

    const propertyId = await createRentalProperty({
      ...validatedData,
      roomList: finalRoomList,
    });

    return NextResponse.json(
      { id: propertyId, message: 'Properti sewa berhasil didaftarkan' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validasi input gagal', issues: error.issues }, { status: 400 });
    }
    console.error('Error in POST /api/rentals:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 400 });
  }
}
