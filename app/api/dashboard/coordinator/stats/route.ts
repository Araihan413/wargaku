import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Belum terautentikasi' }, { status: 401 });
    }

    // Must be Koordinator (Role 5) or RT/Admin with manage-boarding permission
    const isAllowed =
      session.user.roleId === 5 ||
      await hasPermission(session.user.roleId, 'manage-boarding');

    if (!isAllowed) {
      return NextResponse.json({ error: 'Tidak memiliki izin akses' }, { status: 403 });
    }

    const userId = session.user.id;

    // 1. Fetch properties managed by this coordinator (or all active if SA/RT)
    let propertiesQuery;
    if (session.user.roleId === 1 || session.user.roleId === 2) {
      propertiesQuery = db
        .select({
          id: schema.rentalProperties.id,
          name: schema.rentalProperties.name,
          dwellingId: schema.rentalProperties.dwellingId,
          totalRooms: schema.rentalProperties.totalRooms,
          blockNumber: schema.dwellings.blockNumber,
          houseNumber: schema.dwellings.houseNumber,
          type: schema.dwellings.type,
        })
        .from(schema.rentalProperties)
        .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
        .where(eq(schema.rentalProperties.isActive, true));
    } else {
      propertiesQuery = db
        .select({
          id: schema.rentalProperties.id,
          name: schema.rentalProperties.name,
          dwellingId: schema.rentalProperties.dwellingId,
          totalRooms: schema.rentalProperties.totalRooms,
          blockNumber: schema.dwellings.blockNumber,
          houseNumber: schema.dwellings.houseNumber,
          type: schema.dwellings.type,
        })
        .from(schema.rentalProperties)
        .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
        .where(
          and(
            eq(schema.rentalProperties.coordinatorUserId, userId),
            eq(schema.rentalProperties.isActive, true)
          )
        );
    }

    const properties = await propertiesQuery;
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalProperties: 0,
          totalRooms: 0,
          occupiedRooms: 0,
          vacantRooms: 0,
          occupancyRate: 0,
          pendingVerifications: 0,
          totalActiveResidents: 0,
        },
        propertyBreakdown: [],
        pendingQueue: [],
      });
    }

    // 2. Fetch active residents for these properties
    const activeResidents = await db
      .select({
        id: schema.residents.id,
        rentalPropertyId: schema.residents.rentalPropertyId,
        verificationStatus: schema.residents.verificationStatus,
      })
      .from(schema.residents)
      .where(
        and(
          inArray(schema.residents.rentalPropertyId, propertyIds),
          eq(schema.residents.isActive, true)
        )
      );

    // Calculate room occupancy per property
    const propertyBreakdown = properties.map((p) => {
      const occupied = activeResidents.filter((r) => r.rentalPropertyId === p.id).length;
      const vacant = Math.max(p.totalRooms - occupied, 0);
      const occupancyRate = p.totalRooms > 0 ? Math.round((occupied / p.totalRooms) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        address: `Blok ${p.blockNumber} No. ${p.houseNumber}`,
        type: p.type,
        totalRooms: p.totalRooms,
        occupiedRooms: occupied,
        vacantRooms: vacant,
        occupancyRate,
      };
    });

    const totalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
    const occupiedRooms = activeResidents.length;
    const vacantRooms = Math.max(totalRooms - occupiedRooms, 0);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const pendingVerifications = activeResidents.filter((r) => r.verificationStatus === 'pending').length;

    // 3. Fetch 5 most recent pending verification residents for queue section
    const pendingQueueRaw = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        nik: schema.residents.nik,
        residentType: schema.residents.residentType,
        roomNumber: schema.residents.roomNumber,
        checkInDate: schema.residents.checkInDate,
        verificationStatus: schema.residents.verificationStatus,
        ktpFile: schema.residents.ktpFile,
        rentalPropertyId: schema.residents.rentalPropertyId,
      })
      .from(schema.residents)
      .where(
        and(
          inArray(schema.residents.rentalPropertyId, propertyIds),
          eq(schema.residents.isActive, true),
          eq(schema.residents.verificationStatus, 'pending')
        )
      )
      .orderBy(desc(schema.residents.createdAt))
      .limit(5);

    const pendingQueue = pendingQueueRaw.map((r) => {
      const prop = properties.find((p) => p.id === r.rentalPropertyId);
      return {
        id: r.id,
        name: r.name,
        nik: r.nik,
        tenantType: r.residentType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
        roomNumber: r.roomNumber,
        checkInDate: r.checkInDate,
        verificationStatus: r.verificationStatus,
        ktpFile: r.ktpFile,
        propertyName: prop ? prop.name : 'Properti Sewa',
      };
    });

    return NextResponse.json({
      summary: {
        totalProperties: properties.length,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        occupancyRate,
        pendingVerifications,
        totalActiveResidents: occupiedRooms,
      },
      propertyBreakdown,
      pendingQueue,
    });
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/coordinator/stats:', error);
    return NextResponse.json(
      { error: error.message || 'Kesalahan server internal' },
      { status: 500 }
    );
  }
}
