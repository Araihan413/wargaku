import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, like, desc, asc, sql } from 'drizzle-orm';

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
  occupiedRooms?: number;
  notes?: string | null;
}

export interface UpdateRentalPropertyInput {
  name?: string;
  coordinatorUserId?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  totalRooms?: number;
  occupiedRooms?: number;
  notes?: string | null;
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
  dwellingType?: string;
} = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) conditions.push(eq(schema.rentalProperties.isActive, options.isActive));
  if (options.coordinatorUserId) conditions.push(eq(schema.rentalProperties.coordinatorUserId, options.coordinatorUserId));
  if (options.ownerUserId) conditions.push(eq(schema.dwellings.ownerUserId, options.ownerUserId));
  if (options.dwellingType) conditions.push(eq(schema.dwellings.type, options.dwellingType as any));
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
      occupiedRooms: schema.rentalProperties.occupiedRooms,
      isActive: schema.rentalProperties.isActive,
      notes: schema.rentalProperties.notes,
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

  const mappedData = data.map((p) => {
    const vacantRooms = Math.max(0, p.totalRooms - p.occupiedRooms);
    return {
      ...p,
      vacantRooms,
    };
  });

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(whereClause);

  return {
    data: mappedData,
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

  const activeContracts = Number(activeContractsRes?.count ?? 0);
  const vacantRooms = Math.max(0, property.totalRooms - property.occupiedRooms);

  return {
    ...property,
    dwelling: dwelling ?? null,
    activeContracts,
    vacantRooms,
  };
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
  const [dwelling] = await db.select({ type: schema.dwellings.type }).from(schema.dwellings).where(eq(schema.dwellings.id, data.dwellingId)).limit(1);
  if (dwelling?.type === 'kos' && !data.coordinatorUserId) {
    throw new Error('ID Koordinator wajib diisi untuk kos.');
  }

  const [result] = await db.insert(schema.rentalProperties).values({
    dwellingId: data.dwellingId,
    name: data.name,
    coordinatorUserId: data.coordinatorUserId,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    totalRooms: data.totalRooms,
    occupiedRooms: data.occupiedRooms ?? 0,
    isActive: true,
    notes: data.notes ?? null,
  });

  return result.insertId;
}

export async function updateRentalProperty(id: number, data: UpdateRentalPropertyInput) {
  const payload: Record<string, any> = { updatedAt: new Date() };
  if (data.name !== undefined) payload.name = data.name;
  if (data.coordinatorUserId !== undefined) payload.coordinatorUserId = data.coordinatorUserId;
  if (data.contactPerson !== undefined) payload.contactPerson = data.contactPerson;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.totalRooms !== undefined) payload.totalRooms = data.totalRooms;
  if (data.occupiedRooms !== undefined) payload.occupiedRooms = data.occupiedRooms;
  if (data.notes !== undefined) payload.notes = data.notes;
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
 * Jika role 5 yang dihapus sebelumnya adalah role primer (isPrimary: true),
 * otomatis tentukan role lain milik user (atau Role 6 Warga) sebagai role primer.
 */
export async function cleanupOldCoordinatorRole(oldCoordinatorId: string, tx?: any) {
  if (!oldCoordinatorId) return;
  const runner = tx || db;

  const [res] = await runner
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalProperties)
    .where(and(eq(schema.rentalProperties.coordinatorUserId, oldCoordinatorId), eq(schema.rentalProperties.isActive, true)));

  const activeCount = Number(res?.count ?? 0);

  if (activeCount === 0) {
    // Cek apakah user memiliki Role 5 dengan status isPrimary: true
    const [primaryRole5] = await runner
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, oldCoordinatorId), eq(schema.userRoles.roleId, 5), eq(schema.userRoles.isPrimary, true)))
      .limit(1);

    // Hapus role koordinator (5) dari user_roles
    await runner
      .delete(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, oldCoordinatorId), eq(schema.userRoles.roleId, 5)));

    // Jika Role 5 yang dihapus tadi adalah isPrimary, pastikan user tetap memiliki 1 primary role
    if (primaryRole5) {
      const remainingRoles = await runner
        .select({ id: schema.userRoles.id, roleId: schema.userRoles.roleId })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, oldCoordinatorId))
        .orderBy(asc(schema.userRoles.roleId));

      if (remainingRoles.length > 0) {
        // Set role pertama yang tersisa sebagai primary
        await runner
          .update(schema.userRoles)
          .set({ isPrimary: true })
          .where(eq(schema.userRoles.id, remainingRoles[0].id));
      } else {
        // Jika tidak ada role lain, tambahkan Role 6 (Warga) sebagai primary
        await runner
          .insert(schema.userRoles)
          .values({
            userId: oldCoordinatorId,
            roleId: 6,
            isPrimary: true,
          })
          .onDuplicateKeyUpdate({ set: { isPrimary: true } });
      }
    }
  }
}
