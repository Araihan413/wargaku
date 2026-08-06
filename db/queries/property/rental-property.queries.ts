import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateRentalPropertyInput {
  dwellingId: number;
  name: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms: number;
  notes?: string | null;
  roomPattern?: string | null;
  roomList?: string[] | null;
}

export interface UpdateRentalPropertyInput {
  name?: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms?: number;
  notes?: string | null;
  roomPattern?: string | null;
  roomList?: string[] | null;
  isActive?: boolean;
}

// ==========================================
// READ QUERIES
// ==========================================

export async function listRentalProperties(options: {
  limit?: number;
  offset?: number;
  query?: string;
  coordinatorUserId?: string;
  ownerUserId?: string;
  isActive?: boolean;
} = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) conditions.push(eq(schema.rentalProperties.isActive, options.isActive));
  if (options.coordinatorUserId) conditions.push(eq(schema.rentalProperties.coordinatorUserId, options.coordinatorUserId));
  if (options.ownerUserId) conditions.push(eq(schema.dwellings.ownerUserId, options.ownerUserId));
  if (options.query) conditions.push(like(schema.rentalProperties.name, `%${options.query}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Subquery: hitung kontrak aktif per properti
  const activeContractCountSubq = db
    .select({
      rentalPropertyId: schema.rentalContracts.rentalPropertyId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(schema.rentalContracts)
    .where(eq(schema.rentalContracts.isActive, true))
    .groupBy(schema.rentalContracts.rentalPropertyId)
    .as('acc');

  const data = await db
    .select({
      id: schema.rentalProperties.id,
      dwellingId: schema.rentalProperties.dwellingId,
      name: schema.rentalProperties.name,
      coordinatorUserId: schema.rentalProperties.coordinatorUserId,
      contactPerson: schema.rentalProperties.contactPerson,
      phone: schema.rentalProperties.phone,
      totalRooms: schema.rentalProperties.totalRooms,
      isActive: schema.rentalProperties.isActive,
      notes: schema.rentalProperties.notes,
      roomPattern: schema.rentalProperties.roomPattern,
      roomList: schema.rentalProperties.roomList,
      createdAt: schema.rentalProperties.createdAt,
      updatedAt: schema.rentalProperties.updatedAt,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
      coordinatorName: schema.users.name,
      coordinatorPhone: schema.users.phone,
      coordinatorStatus: schema.users.status,
      activeContracts: sql<number>`COALESCE(${activeContractCountSubq.count}, 0)`.mapWith(Number),
    })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .leftJoin(schema.users, eq(schema.rentalProperties.coordinatorUserId, schema.users.id))
    .leftJoin(activeContractCountSubq, eq(schema.rentalProperties.id, activeContractCountSubq.rentalPropertyId))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.rentalProperties.createdAt));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
}

export async function getRentalPropertyById(id: number) {
  const [property] = await db
    .select()
    .from(schema.rentalProperties)
    .where(eq(schema.rentalProperties.id, id))
    .limit(1);

  if (!property) return null;

  const [dwelling] = await db
    .select()
    .from(schema.dwellings)
    .where(eq(schema.dwellings.id, property.dwellingId))
    .limit(1);

  const [activeContractsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalContracts)
    .where(and(eq(schema.rentalContracts.rentalPropertyId, id), eq(schema.rentalContracts.isActive, true)));

  return {
    ...property,
    dwelling: dwelling ?? null,
    activeContracts: Number(activeContractsRes?.count ?? 0),
  };
}

/**
 * Status kamar dan daftar kontrak aktif per kamar.
 */
export async function getRentalPropertyRooms(propertyId: number, property: { totalRooms: number; roomList: any }) {
  let rooms: string[] = [];
  if (Array.isArray(property.roomList) && property.roomList.length > 0) {
    rooms = property.roomList as string[];
  } else {
    for (let i = 1; i <= (property.totalRooms || 0); i++) {
      rooms.push(i.toString().padStart(2, '0'));
    }
  }

  const activeContracts = await db
    .select({
      id: schema.rentalContracts.id,
      roomNumber: schema.rentalContracts.roomNumber,
      tenantType: schema.rentalContracts.tenantType,
      individualName: schema.rentalContracts.individualName,
      individualNik: schema.rentalContracts.individualNik,
      individualPhone: schema.rentalContracts.individualPhone,
      individualKtpFile: schema.rentalContracts.individualKtpFile,
      checkInDate: schema.rentalContracts.checkInDate,
      verificationStatus: schema.rentalContracts.verificationStatus,
      verificationNote: schema.rentalContracts.verificationNote,
      isActive: schema.rentalContracts.isActive,
      userName: schema.users.name,
      userPhone: schema.users.phone,
      familyNumber: schema.families.familyNumber,
      familyKkFile: schema.families.kkFile,
    })
    .from(schema.rentalContracts)
    .leftJoin(schema.users, eq(schema.rentalContracts.userId, schema.users.id))
    .leftJoin(schema.families, eq(schema.rentalContracts.familyId, schema.families.id))
    .where(and(eq(schema.rentalContracts.rentalPropertyId, propertyId), eq(schema.rentalContracts.isActive, true)));

  return rooms.map((roomNum) => {
    const roomContracts = activeContracts.filter(
      (c) => c.roomNumber === roomNum || (c.roomNumber === null && rooms.length === 1)
    );
    let status: 'vacant' | 'occupied' | 'sharing' = 'vacant';
    if (roomContracts.length === 1) status = 'occupied';
    else if (roomContracts.length > 1) status = 'sharing';

    const residents = roomContracts.map((c) => {
      const tenantTypeStr = c.tenantType === 'family' ? ('keluarga' as const) : ('perorangan' as const);
      return {
        id: c.id,
        name: c.individualName || c.userName || 'Penyewa',
        nik: c.individualNik || c.familyNumber || '-',
        phone: c.individualPhone || c.userPhone || null,
        tenantType: tenantTypeStr,
        roomNumber: c.roomNumber,
        checkInDate: c.checkInDate ? (typeof c.checkInDate === 'string' ? c.checkInDate : (c.checkInDate as Date).toISOString()) : new Date().toISOString(),
        verificationStatus: (c.verificationStatus as 'pending' | 'verified' | 'rejected') || 'pending',
        verificationNote: c.verificationNote || null,
        ktpFile: c.individualKtpFile || c.familyKkFile || null,
        isActive: c.isActive,
      };
    });

    return {
      roomNumber: roomNum,
      status,
      residentsCount: roomContracts.length,
      residents,
      contractsCount: roomContracts.length,
      contracts: roomContracts,
    };
  });
}

export async function isPropertyOwner(propertyId: number, userId: string): Promise<boolean> {
  const [result] = await db
    .select({ ownerUserId: schema.dwellings.ownerUserId })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(eq(schema.rentalProperties.id, propertyId))
    .limit(1);
  return result?.ownerUserId === userId;
}

export async function checkExistingActiveRental(dwellingId: number) {
  const [existing] = await db
    .select({ id: schema.rentalProperties.id })
    .from(schema.rentalProperties)
    .where(and(eq(schema.rentalProperties.dwellingId, dwellingId), eq(schema.rentalProperties.isActive, true)))
    .limit(1);
  return !!existing;
}

// ==========================================
// WRITE QUERIES
// ==========================================

export async function createRentalProperty(data: CreateRentalPropertyInput) {
  const hasExisting = await checkExistingActiveRental(data.dwellingId);
  if (hasExisting) throw new Error('Properti sewa aktif sudah terdaftar untuk hunian ini.');
  if (!data.coordinatorUserId) throw new Error('ID Koordinator wajib diisi.');

  const [result] = await db.insert(schema.rentalProperties).values({
    dwellingId: data.dwellingId,
    name: data.name,
    coordinatorUserId: data.coordinatorUserId,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    totalRooms: data.totalRooms,
    isActive: true,
    notes: data.notes ?? null,
    roomPattern: data.roomPattern ?? null,
    roomList: data.roomList ?? null,
  });

  return result.insertId;
}

export async function updateRentalProperty(id: number, data: UpdateRentalPropertyInput) {
  const payload: Record<string, any> = { updatedAt: new Date() };
  if (data.name !== undefined) payload.name = data.name;
  if (data.coordinatorUserId !== undefined && data.coordinatorUserId !== null) payload.coordinatorUserId = data.coordinatorUserId;
  if (data.contactPerson !== undefined) payload.contactPerson = data.contactPerson;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.totalRooms !== undefined) payload.totalRooms = data.totalRooms;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.roomPattern !== undefined) payload.roomPattern = data.roomPattern;
  if (data.roomList !== undefined) payload.roomList = data.roomList;
  if (data.isActive !== undefined) payload.isActive = data.isActive;

  await db.update(schema.rentalProperties).set(payload).where(eq(schema.rentalProperties.id, id));
  return true;
}

export async function deleteRentalProperty(id: number) {
  await db.update(schema.rentalProperties).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.rentalProperties.id, id));
  return true;
}

/**
 * Cleanup koordinator lama jika tidak lagi menjadi koordinator manapun.
 * Via user_roles: jika koordinator tidak lagi punya properti aktif, hapus role 5 dari user_roles.
 */
export async function cleanupOldCoordinatorRole(oldCoordinatorId: string) {
  const [res] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalProperties)
    .where(and(eq(schema.rentalProperties.coordinatorUserId, oldCoordinatorId), eq(schema.rentalProperties.isActive, true)));

  const activeCount = Number(res?.count ?? 0);

  if (activeCount === 0) {
    // Hapus role koordinator (5) dari user_roles
    await db
      .delete(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, oldCoordinatorId), eq(schema.userRoles.roleId, 5)));
  }
}
