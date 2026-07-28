import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { getRentalPropertyById } from '@/db/queries/rental';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; roomNumber: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    const { id, roomNumber } = await params;
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID properti tidak valid' }, { status: 400 });
    }

    const property = await getRentalPropertyById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Properti sewa tidak ditemukan' }, { status: 404 });
    }

    // Check authorization: RT/Admin, coordinator, or owner
    const isGlobalAllowed = await hasPermission(session.user.roleId, 'manage-boarding');
    const isCoordinator = property.coordinatorUserId === session.user.id;
    const isOwner = property.dwelling?.ownerUserId === session.user.id;

    if (!isGlobalAllowed && !isCoordinator && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    // Fetch inactive resident history for this specific room
    const historyRaw = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        nik: schema.residents.nik,
        phone: schema.residents.phone,
        tenantType: schema.residents.residentType,
        checkInDate: schema.residents.checkInDate,
        checkOutDate: schema.residents.checkOutDate,
        inactiveReason: schema.residents.inactiveReason,
        verificationStatus: schema.residents.verificationStatus,
        notes: schema.residents.notes,
        createdAt: schema.residents.createdAt,
      })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.rentalPropertyId, propertyId),
          eq(schema.residents.roomNumber, roomNumber),
          eq(schema.residents.isActive, false)
        )
      )
      .orderBy(desc(schema.residents.checkOutDate), desc(schema.residents.createdAt));

    const history = historyRaw.map((h) => ({
      ...h,
      tenantType: h.tenantType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
    }));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error in GET room history:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
