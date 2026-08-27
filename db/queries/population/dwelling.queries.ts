import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { cleanupOldCoordinatorRole } from '@/db/queries/property/rental-property.queries';
import { decryptPII, maskNIK, maskFamilyNumber, maskPhone } from '@/lib/crypto-pii';



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
        return {
          ...fam,
          familyNumber: decryptPII(fam.familyNumber),
          memberCount: Number(countRes?.count ?? 0),
        };
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
      const vacantRooms = Math.max(0, property.totalRooms - property.occupiedRooms);

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
 * Jika tipe 'kos' atau 'homestay', otomatis buatkan 1 record rental_properties.
 * Khusus tipe 'kos', owner otomatis menjadi coordinatorUserId dan diberi Role 5 (Koordinator Kos).
 */
export async function createDwelling(data: CreateDwellingInput) {
  const cleanOwnerId = cleanNullableString(data.ownerUserId);

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: schema.dwellings.id })
      .from(schema.dwellings)
      .where(and(eq(schema.dwellings.blockNumber, data.blockNumber), eq(schema.dwellings.houseNumber, data.houseNumber)))
      .limit(1);

    if (existing) throw new Error(`DWELLING_ADDRESS_EXISTS:${data.blockNumber}:${data.houseNumber}`);

    const [result] = await tx.insert(schema.dwellings).values({
      blockNumber: data.blockNumber,
      houseNumber: data.houseNumber,
      type: data.type,
      qrToken: `qr-dwelling-${randomUUID()}`,
      isActive: true,
      notes: cleanNullableString(data.notes),
      latitude: cleanNullableString(data.latitude),
      longitude: cleanNullableString(data.longitude),
      ownerUserId: cleanOwnerId,
    });

    const dwellingId = result.insertId;

    // Otomasi pembuatan rental_properties untuk tipe kos & homestay
    if (data.type === 'kos' || data.type === 'homestay') {
      let contactPerson = cleanNullableString(data.ownerName);
      let phone = cleanNullableString(data.ownerPhone);

      // Jika ownerUserId ada tapi nama/telp belum diteruskan, ambil dari users
      if (cleanOwnerId && (!contactPerson || !phone)) {
        const [ownerUser] = await tx
          .select({ name: schema.users.name, phone: schema.users.phone })
          .from(schema.users)
          .where(eq(schema.users.id, cleanOwnerId))
          .limit(1);

        if (ownerUser) {
          contactPerson = contactPerson || ownerUser.name;
          phone = phone || ownerUser.phone;
        }
      }

      const defaultName = data.type === 'kos'
        ? `Kos Blok ${data.blockNumber} No. ${data.houseNumber}`
        : `Homestay Blok ${data.blockNumber} No. ${data.houseNumber}`;

      // Khusus tipe kos: owner otomatis jadi coordinatorUserId. Tipe homestay: coordinatorUserId diset null.
      const coordinatorUserId = data.type === 'kos' ? cleanOwnerId : null;

      await tx.insert(schema.rentalProperties).values({
        dwellingId,
        name: defaultName,
        coordinatorUserId,
        contactPerson,
        phone,
        totalRooms: 1,
        occupiedRooms: 0,
        isActive: true,
        notes: cleanNullableString(data.notes),
      });

      // Khusus tipe kos: jika ada owner, berikan role Koordinator Kos (Role ID 5)
      if (data.type === 'kos' && cleanOwnerId) {
        await tx.insert(schema.userRoles).values({
          userId: cleanOwnerId,
          roleId: 5,
          isPrimary: false,
        }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      }
    }

    return dwellingId;
  });
}

/**
 * Buat banyak hunian sekaligus (bulk).
 * Jika tipe 'kos' atau 'homestay', otomatis buatkan rental_properties untuk masing-masing unit.
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
        const dwellingId = result.insertId;
        inserted.push(dwellingId);

        // Otomasi pembuatan rental_properties bulk untuk kos & homestay
        if (data.type === 'kos' || data.type === 'homestay') {
          const defaultName = data.type === 'kos'
            ? `Kos Blok ${data.blockNumber} No. ${houseNumber}`
            : `Homestay Blok ${data.blockNumber} No. ${houseNumber}`;

          await tx.insert(schema.rentalProperties).values({
            dwellingId,
            name: defaultName,
            coordinatorUserId: null,
            contactPerson: null,
            phone: null,
            totalRooms: 1,
            occupiedRooms: 0,
            isActive: true,
          });
        }
      }
    }
    return inserted;
  });
}

/**
 * Perbarui data hunian.
 * Otomatis sinkronisasi dengan rental_properties dan Role 5 (Koordinator Kos) jika tipe kos / homestay.
 * Membersihkan Role 5 dari koordinator lama jika tidak lagi mengelola kos aktif manapun.
 */
export async function updateDwelling(id: number, data: UpdateDwellingInput) {
  const cleanOwnerId = cleanNullableString(data.ownerUserId);

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: schema.dwellings.id })
      .from(schema.dwellings)
      .where(and(eq(schema.dwellings.blockNumber, data.blockNumber), eq(schema.dwellings.houseNumber, data.houseNumber), ne(schema.dwellings.id, id)))
      .limit(1);

    if (existing) throw new Error(`DWELLING_ADDRESS_EXISTS:${data.blockNumber}:${data.houseNumber}`);

    await tx
      .update(schema.dwellings)
      .set({
        blockNumber: data.blockNumber,
        houseNumber: data.houseNumber,
        type: data.type,
        isActive: data.isActive ?? true,
        notes: cleanNullableString(data.notes),
        latitude: cleanNullableString(data.latitude),
        longitude: cleanNullableString(data.longitude),
        ownerUserId: cleanOwnerId,
      })
      .where(eq(schema.dwellings.id, id));

    const [existingRental] = await tx
      .select()
      .from(schema.rentalProperties)
      .where(eq(schema.rentalProperties.dwellingId, id))
      .limit(1);

    const previousCoordinatorId = existingRental?.coordinatorUserId;

    // Sinkronisasi dengan rental_properties jika tipe kos / homestay
    if (data.type === 'kos' || data.type === 'homestay') {
      let contactPerson = cleanNullableString(data.ownerName);
      let phone = cleanNullableString(data.ownerPhone);

      if (cleanOwnerId && (!contactPerson || !phone)) {
        const [ownerUser] = await tx
          .select({ name: schema.users.name, phone: schema.users.phone })
          .from(schema.users)
          .where(eq(schema.users.id, cleanOwnerId))
          .limit(1);

        if (ownerUser) {
          contactPerson = contactPerson || ownerUser.name;
          phone = phone || ownerUser.phone;
        }
      }

      // Khusus tipe kos: coordinatorUserId diisi cleanOwnerId jika ada. Tipe homestay: null.
      const targetCoordinatorId = data.type === 'kos' ? cleanOwnerId : null;

      if (!existingRental) {
        const defaultName = data.type === 'kos'
          ? `Kos Blok ${data.blockNumber} No. ${data.houseNumber}`
          : `Homestay Blok ${data.blockNumber} No. ${data.houseNumber}`;

        await tx.insert(schema.rentalProperties).values({
          dwellingId: id,
          name: defaultName,
          coordinatorUserId: targetCoordinatorId,
          contactPerson,
          phone,
          totalRooms: 1,
          occupiedRooms: 0,
          isActive: true,
          notes: cleanNullableString(data.notes),
        });
      } else {
        await tx
          .update(schema.rentalProperties)
          .set({
            coordinatorUserId: targetCoordinatorId,
            contactPerson: contactPerson || existingRental.contactPerson,
            phone: phone || existingRental.phone,
            isActive: data.isActive ?? existingRental.isActive,
          })
          .where(eq(schema.rentalProperties.id, existingRental.id));
      }

      // Khusus tipe kos: jika ada ownerUserId baru, berikan Role 5 (Koordinator Kos)
      if (data.type === 'kos' && cleanOwnerId) {
        await tx.insert(schema.userRoles).values({
          userId: cleanOwnerId,
          roleId: 5,
          isPrimary: false,
        }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      }

      // Jika koordinator berganti, periksa dan bersihkan Role 5 koordinator lama jika ia tidak punya kos lain
      if (previousCoordinatorId && previousCoordinatorId !== targetCoordinatorId) {
        await cleanupOldCoordinatorRole(previousCoordinatorId, tx);
      }
    } else {
      // Jika tipe hunian diubah ke 'permanen', nonaktifkan rental_properties jika ada
      if (existingRental) {
        await tx
          .update(schema.rentalProperties)
          .set({ isActive: false })
          .where(eq(schema.rentalProperties.id, existingRental.id));

        if (previousCoordinatorId) {
          await cleanupOldCoordinatorRole(previousCoordinatorId, tx);
        }
      }
    }

    return true;
  });
}

/**
 * Soft-delete hunian (nonaktifkan).
 * Juga menonaktifkan rental_properties dan membersihkan Role 5 koordinator jika tidak memegang kos lain.
 */
export async function deleteDwelling(id: number) {
  return await db.transaction(async (tx) => {
    await tx.update(schema.dwellings).set({ isActive: false }).where(eq(schema.dwellings.id, id));

    const [rental] = await tx
      .select({ id: schema.rentalProperties.id, coordinatorUserId: schema.rentalProperties.coordinatorUserId })
      .from(schema.rentalProperties)
      .where(eq(schema.rentalProperties.dwellingId, id))
      .limit(1);

    if (rental) {
      await tx.update(schema.rentalProperties).set({ isActive: false }).where(eq(schema.rentalProperties.id, rental.id));

      if (rental.coordinatorUserId) {
        await cleanupOldCoordinatorRole(rental.coordinatorUserId, tx);
      }
    }

    return true;
  });
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

/**
 * Data peta lingkungan — seluruh hunian, KK, anggota, dan penyewa.
 * Data sensitif disensor menggunakan utility terpusat jika bukan officer.
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
      .map((family) => {
        const plainFamilyNumber = decryptPII(family.familyNumber);
        return {
          id: family.id,
          familyNumber: isOfficer ? plainFamilyNumber : maskFamilyNumber(plainFamilyNumber),
          headName: family.headName,
          verificationStatus: family.verificationStatus,
          members: allMembers
            .filter((m) => m.familyId === family.id)
            .map((member) => {
              const plainNik = decryptPII(member.nik);
              return {
                id: member.id,
                name: member.name,
                nik: isOfficer ? plainNik : maskNIK(plainNik),
                gender: member.gender,
                relationship: member.relationship,
                occupation: member.occupation,
                educationLevel: member.educationLevel,
                phone: isOfficer ? member.phone : maskPhone(member.phone),
              };
            }),
        };
      });

    const dwellingRentals = allRentalProperties
      .filter((rp) => rp.dwellingId === dwelling.id)
      .map((property) => ({
        id: property.id,
        name: property.name,
        contactPerson: property.contactPerson,
        phone: isOfficer ? property.phone : maskPhone(property.phone),
        totalRooms: property.totalRooms,
        occupiedRooms: property.occupiedRooms,
        vacantRooms: Math.max(0, property.totalRooms - property.occupiedRooms),
        tenants: allRentalContracts
          .filter((c) => c.rentalPropertyId === property.id)
          .map((c) => {
            const nik = decryptPII(c.individualNik || '') || '-';
            return {
              id: c.id,
              tenantType: c.tenantType,
              name: c.individualName,
              nik: isOfficer ? nik : maskNIK(nik),
              phone: isOfficer ? c.individualPhone : maskPhone(c.individualPhone),
              checkInDate: c.checkInDate,
            };
          }),
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
