import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { listRentalProperties, createRentalProperty } from '@/db/queries/rental';
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

    // Filter by the logged-in user as the owner of the dwelling
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

    // 1. Verify that the logged-in user is the owner of this dwelling, or claim it if unclaimed
    const [dwelling] = await db
      .select({ ownerUserId: schema.dwellings.ownerUserId })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, validated.dwellingId))
      .limit(1);

    if (!dwelling) {
      return NextResponse.json({ error: 'Tempat tinggal/dwelling tidak ditemukan' }, { status: 404 });
    }

    // Check if there is already an active rental property for this dwellingId
    const [existingRental] = await db
      .select({ id: schema.rentalProperties.id })
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, validated.dwellingId),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (existingRental) {
      return NextResponse.json({ error: 'Properti sewa aktif sudah terdaftar untuk hunian ini' }, { status: 400 });
    }

    if (!dwelling.ownerUserId) {
      // Auto-claim the dwelling
      await db
        .update(schema.dwellings)
        .set({
          ownerUserId: session.user.id,
          ownerName: session.user.name,
          ownerPhone: session.user.phone || null,
        })
        .where(eq(schema.dwellings.id, validated.dwellingId));
    } else if (dwelling.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Tempat tinggal/dwelling ini sudah dimiliki oleh warga lain' }, { status: 403 });
    }

    // 2. Handle Case B: Penunjukan Koordinator Baru (belum terdaftar di users)
    let coordinatorId = validated.coordinatorUserId || null;

    if (!coordinatorId && body.coordinatorName && body.coordinatorPhone) {
      const cleanPhone = body.coordinatorPhone.replace(/[-\s]/g, '');

      // Check if a user with this phone number already exists
      const [existingUser] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.phone, cleanPhone))
        .limit(1);

      if (existingUser) {
        coordinatorId = existingUser.id;
      } else {
        const newUserId = crypto.randomUUID();
        const tempEmail = `pending-${cleanPhone}-${Math.random().toString(36).substring(2, 7)}@wargaku.temp`;

        await db.insert(schema.users).values({
          id: newUserId,
          name: body.coordinatorName,
          email: tempEmail,
          phone: cleanPhone,
          roleId: 5, // Koordinator Kost
          status: 'pending', // RT must approve this coordinator user account
          emailVerified: false,
        });
        coordinatorId = newUserId;
      }
    }

    // Process and validate roomPattern / roomList
    let finalRoomList: string[] = [];
    if (validated.roomPattern) {
      const parsed = validateAndParseRoomPattern(validated.roomPattern);
      if (!parsed.isValid) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      finalRoomList = parsed.rooms;
      // Auto-update totalRooms if a pattern is used
      validated.totalRooms = finalRoomList.length;
    } else {
      // Default fallback: numbers padded with zero
      finalRoomList = generateDefaultRooms(validated.totalRooms);
    }

    // 3. Create the rental property
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
