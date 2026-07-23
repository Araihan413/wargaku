import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import {
  getRentalPropertyById,
  updateRentalProperty,
  deleteRentalProperty,
  isPropertyOwner,
} from '@/db/queries/rental';
import { updateRentalPropertySchema } from '@/lib/validations/rental';
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

    const { id } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // Verify property ownership
    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 });
    }

    // Get coordinator details if assigned
    let coordinator = null;
    if (property.coordinatorUserId) {
      const [user] = await db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          status: schema.users.status,
        })
        .from(schema.users)
        .where(eq(schema.users.id, property.coordinatorUserId))
        .limit(1);
      coordinator = user || null;
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

    // Verify ownership
    const isOwner = await isPropertyOwner(propertyId, session.user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk properti ini' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateRentalPropertySchema.parse(body);

    // Handle coordinator penunjukan
    let coordinatorId = validated.coordinatorUserId;
    
    // If setting coordinator but they don't have account yet
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
          status: 'pending',
        });
        coordinatorId = newUserId;
      }
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

    // Verify ownership
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
