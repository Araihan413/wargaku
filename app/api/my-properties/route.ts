import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { listRentalProperties, createRentalProperty } from '@/db/queries/rental';
import { createRentalPropertySchema } from '@/lib/validations/rental';
import { ZodError } from 'zod';

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

    if (!coordinatorId && body.coordinatorEmail && body.coordinatorNik && body.coordinatorName) {
      const [existingUser] = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(
          or(
            eq(schema.users.email, body.coordinatorEmail),
            eq(schema.users.nik, body.coordinatorNik)
          )
        )
        .limit(1);

      if (existingUser) {
        coordinatorId = existingUser.id;
      } else {
        const newUserId = crypto.randomUUID();
        await db.insert(schema.users).values({
          id: newUserId,
          name: body.coordinatorName,
          email: body.coordinatorEmail,
          nik: body.coordinatorNik,
          phone: body.coordinatorPhone || null,
          roleId: 5, // Koordinator Kost
          status: 'pending', // RT must approve this coordinator user account
        });
        coordinatorId = newUserId;
      }
    }

    // 3. Create the rental property
    const propertyId = await createRentalProperty({
      ...validated,
      coordinatorUserId: coordinatorId,
    });

    return NextResponse.json({
      id: propertyId,
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
