import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateDwellingInput {
  blockNumber: string;
  houseNumber: string;
  type: 'permanen' | 'kos' | 'homestay';
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
}

export interface UpdateDwellingInput {
  blockNumber: string;
  houseNumber: string;
  type: 'permanen' | 'kos' | 'homestay';
  isActive?: boolean;
  notes?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
}

export interface ListDwellingsOptions {
  limit?: number;
  offset?: number;
  query?: string;
  type?: 'permanen' | 'kos' | 'homestay';
  isActive?: boolean;
  coordinatorUserId?: string;
}

// ==========================================
// READ QUERIES
// ==========================================

/**
 * Daftar hunian terpaginasi untuk admin.
 * Menampilkan info keluarga aktif dan properti sewa.
 */
export async function listDwellingsAdmin(options: ListDwellingsOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) conditions.push(eq(schema.dwellings.isActive, options.isActive));
  if (options.type) conditions.push(eq(schema.dwellings.type, options.type));
  if (options.query) {
    const v = `%${options.query}%`;
    conditions.push(or(like(schema.dwellings.blockNumber, v), like(schema.dwellings.houseNumber, v), like(schema.dwellings.notes, v)));
  }
  if (options.coordinatorUserId) {
    conditions.push(eq(schema.rentalProperties.coordinatorUserId, options.coordinatorUserId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Subquery: hitung family_members aktif per dwelling (via families)
  const memberCountSubquery = db
    .select({
      dwellingId: schema.families.dwellingId,
      memberCountVal: sql<number>`count(*)`.as('member_count_val'),
    })
    .from(schema.familyMembers)
    .innerJoin(schema.families, eq(schema.familyMembers.familyId, schema.families.id))
    .where(and(eq(schema.familyMembers.isActive, true), eq(schema.families.isActive, true)))
    .groupBy(schema.families.dwellingId)
    .as('member_count');

  // Subquery: hitung kontrak sewa aktif per dwelling (via rental_properties)
  const tenantCountSubquery = db
    .select({
      dwellingId: schema.rentalProperties.dwellingId,
      tenantCountVal: sql<number>`count(*)`.as('tenant_count_val'),
    })
    .from(schema.rentalContracts)
    .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
    .where(eq(schema.rentalContracts.isActive, true))
    .groupBy(schema.rentalProperties.dwellingId)
    .as('tenant_count');

  const data = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      ownerUserId: schema.dwellings.ownerUserId,
      ownerName: schema.users.name,
      ownerPhone: schema.users.phone,
      qrToken: schema.dwellings.qrToken,
      latitude: schema.dwellings.latitude,
      longitude: schema.dwellings.longitude,
      type: schema.dwellings.type,
      isActive: schema.dwellings.isActive,
      notes: schema.dwellings.notes,
      createdAt: schema.dwellings.createdAt,
      totalRooms: schema.rentalProperties.totalRooms,
      memberCount: sql<number>`COALESCE(${memberCountSubquery.memberCountVal}, 0)`.mapWith(Number),
      tenantCount: sql<number>`COALESCE(${tenantCountSubquery.tenantCountVal}, 0)`.mapWith(Number),
    })
    .from(schema.dwellings)
    .leftJoin(schema.users, eq(schema.dwellings.ownerUserId, schema.users.id))
    .leftJoin(schema.rentalProperties, and(eq(schema.dwellings.id, schema.rentalProperties.dwellingId), eq(schema.rentalProperties.isActive, true)))
    .leftJoin(memberCountSubquery, eq(schema.dwellings.id, memberCountSubquery.dwellingId))
    .leftJoin(tenantCountSubquery, eq(schema.dwellings.id, tenantCountSubquery.dwellingId))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.dwellings.createdAt));

  let totalCountQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.dwellings)
    .$dynamic();

  if (options.coordinatorUserId) {
    totalCountQuery = totalCountQuery.leftJoin(schema.rentalProperties, and(eq(schema.dwellings.id, schema.rentalProperties.dwellingId), eq(schema.rentalProperties.isActive, true)));
  }

  const [totalResult] = await totalCountQuery.where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
}

/**
 * Detail hunian berdasarkan ID, termasuk keluarga atau properti sewa.
 */
export async function getDwellingDetailById(id: number) {
  const [dwelling] = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      ownerUserId: schema.dwellings.ownerUserId,
      ownerName: schema.users.name,
      ownerPhone: schema.users.phone,
      qrToken: schema.dwellings.qrToken,
      latitude: schema.dwellings.latitude,
      longitude: schema.dwellings.longitude,
      type: schema.dwellings.type,
      isActive: schema.dwellings.isActive,
      notes: schema.dwellings.notes,
      createdAt: schema.dwellings.createdAt,
    })
    .from(schema.dwellings)
    .leftJoin(schema.users, eq(schema.dwellings.ownerUserId, schema.users.id))
    .where(eq(schema.dwellings.id, id))
    .limit(1);

  if (!dwelling) return null;

  if (dwelling.type === 'permanen') {
    const activeFamilies = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        headName: schema.users.name,
        verificationStatus: schema.families.verificationStatus,
      })
      .from(schema.families)
      .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
      .where(and(eq(schema.families.dwellingId, id), eq(schema.families.isActive, true)));

    const familiesWithCount = await Promise.all(
      activeFamilies.map(async (fam) => {
        const [countRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.familyMembers)
          .where(and(eq(schema.familyMembers.familyId, fam.id), eq(schema.familyMembers.isActive, true)));
        return { ...fam, memberCount: Number(countRes?.count ?? 0) };
      })
    );

    return { ...dwelling, families: familiesWithCount };
  }

  if (dwelling.type === 'kos' || dwelling.type === 'homestay') {
    const [property] = await db
      .select()
      .from(schema.rentalProperties)
      .where(and(eq(schema.rentalProperties.dwellingId, id), eq(schema.rentalProperties.isActive, true)))
      .limit(1);

    if (property) {
      let coordinator = null;
      if (property.coordinatorUserId) {
        const [coord] = await db
          .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone, email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.id, property.coordinatorUserId))
          .limit(1);
        coordinator = coord ?? null;
      }

      const [activeTenantsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.rentalContracts)
        .where(and(eq(schema.rentalContracts.rentalPropertyId, property.id), eq(schema.rentalContracts.isActive, true)));

      const activeTenants = Number(activeTenantsCount?.count ?? 0);
      const vacantRooms = Math.max(0, property.totalRooms - activeTenants);

      return { ...dwelling, property: { ...property, activeTenants, vacantRooms, coordinator } };
    }
  }

  return { ...dwelling };
}

export const getDwellingById = getDwellingDetailById;

/**
 * Daftar hunian aktif untuk dropdown publik (registrasi, dll).
 */
export async function listActiveDwellingsPublic() {
  const dwellings = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      type: schema.dwellings.type,
      ownerUserId: schema.dwellings.ownerUserId,
      hasActiveRental: sql<boolean>`CASE WHEN ${schema.rentalProperties.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(schema.dwellings)
    .leftJoin(
      schema.rentalProperties,
      and(eq(schema.dwellings.id, schema.rentalProperties.dwellingId), eq(schema.rentalProperties.isActive, true))
    )
    .where(eq(schema.dwellings.isActive, true));

  return dwellings.map((d) => ({
    id: d.id,
    label: `Blok ${d.blockNumber} No. ${d.houseNumber}`,
    blockNumber: d.blockNumber,
    houseNumber: d.houseNumber,
    type: d.type,
    ownerUserId: d.ownerUserId,
    hasActiveRental: d.hasActiveRental,
  }));
}

/**
 * Ambil pemilik sebuah dwelling.
 */
export async function getDwellingOwner(dwellingId: number) {
  const [dwelling] = await db
    .select({ ownerUserId: schema.dwellings.ownerUserId, type: schema.dwellings.type })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.id, dwellingId))
    .limit(1);
  return dwelling ?? null;
}

// ==========================================
// WRITE QUERIES
// ==========================================

const cleanNullableString = (val?: string | null) => {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Buat hunian baru.
 */
export async function createDwelling(data: CreateDwellingInput) {
  const [existing] = await db
    .select({ id: schema.dwellings.id })
    .from(schema.dwellings)
    .where(and(eq(schema.dwellings.blockNumber, data.blockNumber), eq(schema.dwellings.houseNumber, data.houseNumber)))
    .limit(1);

  if (existing) throw new Error(`DWELLING_ADDRESS_EXISTS:${data.blockNumber}:${data.houseNumber}`);

  const [result] = await db.insert(schema.dwellings).values({
    blockNumber: data.blockNumber,
    houseNumber: data.houseNumber,
    type: data.type,
    qrToken: `qr-dwelling-${randomUUID()}`,
    isActive: true,
    notes: cleanNullableString(data.notes),
    latitude: cleanNullableString(data.latitude),
    longitude: cleanNullableString(data.longitude),
    ownerUserId: cleanNullableString(data.ownerUserId),
  });

  return result.insertId;
}

/**
 * Buat banyak hunian sekaligus (bulk).
 */
export async function createDwellingsBulk(data: {
  blockNumber: string;
  startNumber: number;
  endNumber: number;
  type: 'permanen' | 'kos' | 'homestay';
}) {
  return await db.transaction(async (tx) => {
    const inserted: number[] = [];
    for (let num = data.startNumber; num <= data.endNumber; num++) {
      const houseNumber = String(num);
      const [existing] = await tx
        .select({ id: schema.dwellings.id })
        .from(schema.dwellings)
        .where(and(eq(schema.dwellings.blockNumber, data.blockNumber), eq(schema.dwellings.houseNumber, houseNumber)))
        .limit(1);

      if (!existing) {
        const [result] = await tx.insert(schema.dwellings).values({
          blockNumber: data.blockNumber,
          houseNumber,
          type: data.type,
          qrToken: `qr-dwelling-${randomUUID()}`,
          isActive: true,
        });
        inserted.push(result.insertId);
      }
    }
    return inserted;
  });
}

/**
 * Perbarui data hunian.
 */
export async function updateDwelling(id: number, data: UpdateDwellingInput) {
  const [existing] = await db
    .select({ id: schema.dwellings.id })
    .from(schema.dwellings)
    .where(and(eq(schema.dwellings.blockNumber, data.blockNumber), eq(schema.dwellings.houseNumber, data.houseNumber), ne(schema.dwellings.id, id)))
    .limit(1);

  if (existing) throw new Error(`DWELLING_ADDRESS_EXISTS:${data.blockNumber}:${data.houseNumber}`);

  await db
    .update(schema.dwellings)
    .set({
      blockNumber: data.blockNumber,
      houseNumber: data.houseNumber,
      type: data.type,
      isActive: data.isActive ?? true,
      notes: cleanNullableString(data.notes),
      latitude: cleanNullableString(data.latitude),
      longitude: cleanNullableString(data.longitude),
      ownerUserId: cleanNullableString(data.ownerUserId),
    })
    .where(eq(schema.dwellings.id, id));

  return true;
}

/**
 * Soft-delete hunian (nonaktifkan).
 */
export async function deleteDwelling(id: number) {
  await db.update(schema.dwellings).set({ isActive: false }).where(eq(schema.dwellings.id, id));
  return true;
}

/**
 * Klaim kepemilikan hunian.
 */
export async function claimDwellingOwner(
  dwellingId: number,
  ownerUserId: string,
  _ownerName?: string,
  _ownerPhone?: string | null
) {
  await db
    .update(schema.dwellings)
    .set({ ownerUserId })
    .where(eq(schema.dwellings.id, dwellingId));
}

/**
 * Validasi dan lakukan efek samping perubahan tipe hunian.
 */
export async function validateAndChangeDwellingType(dwellingId: number, currentType: string, newType: string) {
  if (newType === currentType) return;

  if (currentType === 'permanen') {
    const [res] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.families)
      .where(and(eq(schema.families.dwellingId, dwellingId), eq(schema.families.isActive, true)));
    if (Number(res?.count || 0) > 0) throw new Error('HAS_ACTIVE_FAMILIES');
  } else if (currentType === 'kos' || currentType === 'homestay') {
    const [res] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rentalContracts)
      .innerJoin(schema.rentalProperties, eq(schema.rentalContracts.rentalPropertyId, schema.rentalProperties.id))
      .where(and(eq(schema.rentalProperties.dwellingId, dwellingId), eq(schema.rentalContracts.isActive, true)));
    if (Number(res?.count || 0) > 0) throw new Error('HAS_ACTIVE_TENANTS');

    if (newType === 'permanen') {
      await db
        .update(schema.rentalProperties)
        .set({ isActive: false })
        .where(eq(schema.rentalProperties.dwellingId, dwellingId));
    }
  }
}

// ==========================================
// NEIGHBORHOOD MAP QUERY
// ==========================================

const _censorNik = (nik: string | null) => {
  if (!nik) return '-';
  if (nik.length <= 6) return nik;
  return `${nik.slice(0, 3)}${'*'.repeat(nik.length - 6)}${nik.slice(-3)}`;
};

const _censorPhone = (phone: string | null) => {
  if (!phone) return '-';
  if (phone.length <= 5) return phone;
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 7)}${phone.slice(-3)}`;
};

/**
 * Data peta lingkungan — seluruh hunian, KK, anggota, dan penyewa.
 * Data sensitif disensor jika bukan officer.
 */
export async function getNeighborhoodMap(isOfficer: boolean) {
  const allDwellings = await db.select().from(schema.dwellings).where(eq(schema.dwellings.isActive, true));
  const allFamilies = await db
    .select({
      id: schema.families.id,
      dwellingId: schema.families.dwellingId,
      familyNumber: schema.families.familyNumber,
      headName: schema.users.name,
      verificationStatus: schema.families.verificationStatus,
    })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(eq(schema.families.isActive, true));

  const allMembers = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.isActive, true));

  const allRentalProperties = await db.select().from(schema.rentalProperties).where(eq(schema.rentalProperties.isActive, true));

  const allRentalContracts = await db
    .select()
    .from(schema.rentalContracts)
    .where(eq(schema.rentalContracts.isActive, true));

  return allDwellings.map((dwelling) => {
    const dwellingFamilies = allFamilies
      .filter((f) => f.dwellingId === dwelling.id)
      .map((family) => ({
        id: family.id,
        familyNumber: isOfficer
          ? family.familyNumber
          : `${family.familyNumber.slice(0, 4)}${'*'.repeat(Math.max(0, family.familyNumber.length - 8))}${family.familyNumber.slice(-4)}`,
        headName: family.headName,
        verificationStatus: family.verificationStatus,
        members: allMembers
          .filter((m) => m.familyId === family.id)
          .map((member) => ({
            id: member.id,
            name: member.name,
            nik: isOfficer ? member.nik : _censorNik(member.nik),
            gender: member.gender,
            relationship: member.relationship,
            occupation: member.occupation,
            educationLevel: member.educationLevel,
            phone: isOfficer ? member.phone : _censorPhone(member.phone),
          })),
      }));

    const dwellingRentals = allRentalProperties
      .filter((rp) => rp.dwellingId === dwelling.id)
      .map((property) => ({
        id: property.id,
        name: property.name,
        contactPerson: property.contactPerson,
        phone: isOfficer ? property.phone : _censorPhone(property.phone),
        totalRooms: property.totalRooms,
        tenants: allRentalContracts
          .filter((c) => c.rentalPropertyId === property.id)
          .map((contract) => ({
            id: contract.id,
            roomNumber: contract.roomNumber,
            tenantType: contract.tenantType,
            name: contract.individualName,
            nik: isOfficer ? contract.individualNik : _censorNik(contract.individualNik),
            phone: isOfficer ? contract.individualPhone : _censorPhone(contract.individualPhone),
            checkInDate: contract.checkInDate,
          })),
      }));

    return {
      id: dwelling.id,
      blockNumber: dwelling.blockNumber,
      houseNumber: dwelling.houseNumber,
      type: dwelling.type,
      notes: dwelling.notes,
      latitude: dwelling.latitude,
      longitude: dwelling.longitude,
      families: dwellingFamilies,
      rentalProperties: dwellingRentals,
    };
  });
}

export interface DwellingOption {
  id: number;
  blockNumber: string;
  houseNumber: string;
  type: string;
  qrToken: string;
  ownerName?: string | null;
  familyHeadName?: string | null;
  propertyName?: string | null;
}

export async function getQrCodePageData() {
  const [settings] = await db.select().from(schema.systemSettings).limit(1);
  const dwellings = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      type: schema.dwellings.type,
      qrToken: schema.dwellings.qrToken,
      ownerName: schema.users.name,
    })
    .from(schema.dwellings)
    .leftJoin(schema.users, eq(schema.dwellings.ownerUserId, schema.users.id))
    .where(eq(schema.dwellings.isActive, true));

  return {
    systemSettings: settings || null,
    dwellings,
  };
}
