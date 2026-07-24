import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Hanya RT/Admin yang memiliki hak penonaktifan koordinator
    const isAllowed = await hasPermission(session.user.roleId, 'manage-dwellings');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const resolvedParams = await params;
    const coordinatorId = resolvedParams.id;

    if (!coordinatorId) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    }

    // 1. Dapatkan daftar properti yang dikelola koordinator ini untuk dialihkan ke Pemilik Hunian
    const managedProperties = await db
      .select({
        id: schema.rentalProperties.id,
        ownerUserId: schema.dwellings.ownerUserId,
      })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .where(and(
        eq(schema.rentalProperties.coordinatorUserId, coordinatorId),
        eq(schema.rentalProperties.isActive, true)
      ));

    // 2. Alihkan pengelolaan ke pemilik hunian masing-masing
    for (const prop of managedProperties) {
      await db
        .update(schema.rentalProperties)
        .set({
          coordinatorUserId: prop.ownerUserId || null,
        })
        .where(eq(schema.rentalProperties.id, prop.id));
    }

    // 3. Suspend akun koordinator
    await db
      .update(schema.users)
      .set({
        status: 'suspended',
      })
      .where(eq(schema.users.id, coordinatorId));

    return NextResponse.json({
      success: true,
      message: `Akun koordinator dinonaktifkan. Pengelolaan ${managedProperties.length} properti dialihkan kembali ke pemilik hunian.`,
    });

  } catch (error: any) {
    console.error('Error in PUT /api/coordinators/[id]:', error);
    return NextResponse.json({ error: error.message || 'Kesalahan server internal' }, { status: 500 });
  }
}
