import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, type SQL } from 'drizzle-orm';
import {
  createRentalPropertySchema,
  updateRentalPropertySchema,
  createRentalResidentSchema,
  updateRentalResidentSchema,
} from '@/lib/validations/rental';
import { hashPassword } from 'better-auth/crypto';
import { sendEmail } from '@/lib/mail';
import { getTenantFamilyWelcomeEmail } from '@/lib/emails/templates';
import { z } from 'zod';


export type CreateRentalPropertyInput = z.infer<typeof createRentalPropertySchema>;
export type UpdateRentalPropertyInput = z.infer<typeof updateRentalPropertySchema>;
export type CreateRentalResidentInput = z.infer<typeof createRentalResidentSchema>;
export type UpdateRentalResidentInput = z.infer<typeof updateRentalResidentSchema>;

// ==========================================
// RENTAL PROPERTIES CRUD QUERIES
// ==========================================

export async function listRentalProperties(options: {
  limit?: number;
  offset?: number;
  query?: string;
  coordinatorUserId?: string;
  ownerUserId?: string;
  isActive?: boolean;
} = {}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions = [];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.rentalProperties.isActive, options.isActive));
    }
    if (options.coordinatorUserId !== undefined) {
      conditions.push(eq(schema.rentalProperties.coordinatorUserId, options.coordinatorUserId));
    }
    if (options.ownerUserId !== undefined) {
      conditions.push(eq(schema.dwellings.ownerUserId, options.ownerUserId));
    }
    if (options.query) {
      conditions.push(like(schema.rentalProperties.name, `%${options.query}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
        type: schema.dwellings.type,
        coordinatorName: schema.users.name,
        coordinatorPhone: schema.users.phone,
        coordinatorStatus: schema.users.status,
        coordinatorHasPassword: sql<boolean>`CASE WHEN ${schema.users.password} IS NOT NULL THEN true ELSE false END`,
      })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .leftJoin(schema.users, eq(schema.rentalProperties.coordinatorUserId, schema.users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.rentalProperties.createdAt));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data,
      metadata: {
        total,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error('Error in listRentalProperties:', error);
    throw new Error('Gagal mengambil daftar properti sewa');
  }
}

export async function getRentalPropertyById(id: number) {
  try {
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

    // Ambil jumlah resident yang aktif di properti sewa ini
    const activeResidentsCountResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.rentalPropertyId, id),
          eq(schema.residents.isActive, true)
        )
      );

    const activeResidentsCount = Number(activeResidentsCountResult[0]?.count ?? 0);

    return {
      ...property,
      dwelling: dwelling || null,
      activeResidentsCount,
    };
  } catch (error) {
    console.error('Error in getRentalPropertyById:', error);
    throw new Error('Gagal mengambil detail properti sewa');
  }
}

export async function createRentalProperty(data: CreateRentalPropertyInput) {
  const validated = createRentalPropertySchema.parse(data);
  try {
    // Safety check: verify no active rental property exists for the dwellingId
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
      throw new Error('Properti sewa aktif sudah terdaftar untuk hunian ini');
    }

    const [insertResult] = await db.insert(schema.rentalProperties).values({
      dwellingId: validated.dwellingId,
      name: validated.name,
      coordinatorUserId: validated.coordinatorUserId,
      contactPerson: validated.contactPerson,
      phone: validated.phone,
      totalRooms: validated.totalRooms,
      isActive: true,
      notes: validated.notes,
      roomPattern: validated.roomPattern,
      roomList: validated.roomList,
    });
    return insertResult.insertId;
  } catch (error: any) {
    console.error('Error in createRentalProperty:', error);
    throw new Error(error.message || 'Gagal membuat properti sewa baru');
  }
}

export async function updateRentalProperty(id: number, data: UpdateRentalPropertyInput) {
  const validated = updateRentalPropertySchema.parse(data);
  try {
    await db
      .update(schema.rentalProperties)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(schema.rentalProperties.id, id));
    return true;
  } catch (error) {
    console.error('Error in updateRentalProperty:', error);
    throw new Error('Gagal memperbarui properti sewa');
  }
}

export async function deleteRentalProperty(id: number) {
  try {
    // Soft delete
    await db
      .update(schema.rentalProperties)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.rentalProperties.id, id));
    return true;
  } catch (error) {
    console.error('Error in deleteRentalProperty:', error);
    throw new Error('Gagal menonaktifkan properti sewa');
  }
}

// ==========================================
// RENTAL RESIDENTS CRUD QUERIES
// ==========================================

export async function listRentalResidents(options: {
  rentalPropertyId: number;
  limit?: number;
  offset?: number;
  isActive?: boolean;
  query?: string;
}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions: (SQL | undefined)[] = [
      eq(schema.residents.rentalPropertyId, options.rentalPropertyId)
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.residents.isActive, options.isActive));
    }
    if (options.query) {
      conditions.push(
        or(
          like(schema.residents.name, `%${options.query}%`),
          like(schema.residents.nik, `%${options.query}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select({
        resident: schema.residents,
        familyVerificationStatus: schema.families.verificationStatus,
      })
      .from(schema.residents)
      .leftJoin(
        schema.families,
        eq(schema.residents.familyId, schema.families.id)
      )
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.residents.createdAt));

    const data = rows.map(({ resident, familyVerificationStatus }) => ({
      ...resident,
      tenantType: resident.residentType === 'sewa_keluarga' ? 'keluarga' : 'perorangan',
      verificationStatus:
        resident.residentType === 'sewa_keluarga' && familyVerificationStatus
          ? (familyVerificationStatus as any)
          : resident.verificationStatus,
    }));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.residents)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data,
      metadata: {
        total,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error('Error in listRentalResidents:', error);
    throw new Error('Gagal mengambil daftar penghuni sewa');
  }
}

export async function getRentalResidentById(id: number) {
  try {
    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, id))
      .limit(1);

    if (!resident) return null;

    return {
      ...resident,
      tenantType: resident.residentType === 'sewa_keluarga' ? 'keluarga' : 'perorangan',
    };
  } catch (error) {
    console.error('Error in getRentalResidentById:', error);
    throw new Error('Gagal mengambil detail data penghuni');
  }
}

export async function getRentalResidentByNik(nik: string) {
  try {
    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.nik, nik))
      .limit(1);

    if (!resident) return null;

    return {
      ...resident,
      tenantType: resident.residentType === 'sewa_keluarga' ? 'keluarga' : 'perorangan',
    };
  } catch (error) {
    console.error('Error in getRentalResidentByNik:', error);
    throw new Error('Gagal mengambil data penghuni berdasarkan NIK');
  }
}

export async function createRentalResident(data: CreateRentalResidentInput & { rentalPropertyId: number; createdBy: string }) {
  const validated = createRentalResidentSchema.parse(data);

  // Check NIK uniqueness before insert
  const existingResident = await getRentalResidentByNik(validated.nik);
  if (existingResident) {
    throw new Error(`NIK ${validated.nik} sudah terdaftar di sistem kependudukan.`);
  }

  const checkInDate = validated.checkInDate instanceof Date
    ? validated.checkInDate
    : new Date(String(validated.checkInDate));

  const residentType = validated.tenantType === 'keluarga' ? 'sewa_keluarga' : 'sewa_perorangan';

  try {
    const [insertResult] = await db.insert(schema.residents).values({
      rentalPropertyId: data.rentalPropertyId,
      residentType: residentType,
      relationship: validated.tenantType === 'keluarga' ? 'Kepala_Keluarga' : null,
      familyId: validated.familyId,
      name: validated.name,
      nik: validated.nik,
      gender: 'L',
      phone: validated.phone,
      originAddress: validated.originAddress,
      occupation: validated.occupation,
      educationLevel: validated.educationLevel,
      roomNumber: validated.roomNumber,
      checkInDate: checkInDate,
      ktpFile: validated.ktpFile,
      verificationStatus: 'pending',
      createdBy: data.createdBy,
      isActive: true,
      notes: validated.notes,
    });
    return insertResult.insertId;
  } catch (error: any) {
    console.error('Error in createRentalResident:', error);
    throw error;
  }
}

export async function updateRentalResident(id: number, data: UpdateRentalResidentInput & { updatedBy?: string }) {
  const validated = updateRentalResidentSchema.parse(data);
  try {
    const { tenantType, ...restValidated } = validated as any;
    const updateData: any = {
      ...restValidated,
      updatedAt: new Date(),
    };

    if (tenantType) {
      updateData.residentType = tenantType === 'keluarga' ? 'sewa_keluarga' : 'sewa_perorangan';
    }

    if (data.updatedBy) {
      updateData.updatedBy = data.updatedBy;
    }
    
    await db
      .update(schema.residents)
      .set(updateData)
      .where(eq(schema.residents.id, id));
    return true;
  } catch (error) {
    console.error('Error in updateRentalResident:', error);
    throw new Error('Gagal memperbarui data penghuni');
  }
}

export async function deleteRentalResident(id: number) {
  try {
    await db.delete(schema.residents).where(eq(schema.residents.id, id));
    return true;
  } catch (error) {
    console.error('Error in deleteRentalResident:', error);
    throw new Error('Gagal menghapus data penghuni');
  }
}

export async function listAllRentalResidents(options: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
  tenantType?: 'perorangan' | 'keluarga';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  query?: string;
}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions: (SQL | undefined)[] = [
      or(
        eq(schema.residents.residentType, 'sewa_perorangan'),
        eq(schema.residents.residentType, 'sewa_keluarga')
      )
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.residents.isActive, options.isActive));
    }
    if (options.tenantType !== undefined) {
      const mappedType = options.tenantType === 'keluarga' ? 'sewa_keluarga' : 'sewa_perorangan';
      conditions.push(eq(schema.residents.residentType, mappedType));
    }
    if (options.verificationStatus !== undefined) {
      conditions.push(eq(schema.residents.verificationStatus, options.verificationStatus));
    }
    if (options.query) {
      conditions.push(
        or(
          like(schema.residents.name, `%${options.query}%`),
          like(schema.residents.nik, `%${options.query}%`),
          like(schema.rentalProperties.name, `%${options.query}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    const rows = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        nik: schema.residents.nik,
        phone: schema.residents.phone,
        residentType: schema.residents.residentType,
        roomNumber: schema.residents.roomNumber,
        checkInDate: schema.residents.checkInDate,
        checkOutDate: schema.residents.checkOutDate,
        verificationStatus: schema.residents.verificationStatus,
        verificationNote: schema.residents.verificationNote,
        isActive: schema.residents.isActive,
        notes: schema.residents.notes,
        ktpFile: schema.residents.ktpFile,
        originAddress: schema.residents.originAddress,
        occupation: schema.residents.occupation,
        educationLevel: schema.residents.educationLevel,
        religion: schema.residents.religion,
        propertyName: schema.rentalProperties.name,
        rentalPropertyId: schema.rentalProperties.id,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        familyVerificationStatus: schema.families.verificationStatus,
      })
      .from(schema.residents)
      .innerJoin(
        schema.rentalProperties,
        eq(schema.residents.rentalPropertyId, schema.rentalProperties.id)
      )
      .innerJoin(
        schema.dwellings,
        eq(schema.rentalProperties.dwellingId, schema.dwellings.id)
      )
      .leftJoin(
        schema.families,
        eq(schema.residents.familyId, schema.families.id)
      )
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.residents.createdAt));

    const data = rows.map(({ familyVerificationStatus, residentType, ...item }) => ({
      ...item,
      tenantType: residentType === 'sewa_keluarga' ? 'keluarga' : 'perorangan',
      verificationStatus:
        residentType === 'sewa_keluarga' && familyVerificationStatus
          ? (familyVerificationStatus as any)
          : item.verificationStatus,
    }));

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.residents)
      .innerJoin(
        schema.rentalProperties,
        eq(schema.residents.rentalPropertyId, schema.rentalProperties.id)
      )
      .innerJoin(
        schema.dwellings,
        eq(schema.rentalProperties.dwellingId, schema.dwellings.id)
      )
      .where(whereClause);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      data,
      metadata: {
        total,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error('Error in listAllRentalResidents:', error);
    throw new Error('Gagal mengambil daftar semua penghuni sewa');
  }
}

export async function isPropertyOwner(propertyId: number, userId: string): Promise<boolean> {
  try {
    const [result] = await db
      .select({ ownerUserId: schema.dwellings.ownerUserId })
      .from(schema.rentalProperties)
      .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
      .where(eq(schema.rentalProperties.id, propertyId))
      .limit(1);
    return result?.ownerUserId === userId;
  } catch (error) {
    console.error('Error in isPropertyOwner:', error);
    return false;
  }
}

/**
 * Cek apakah sudah ada properti sewa aktif untuk dwellingId tertentu.
 */
export async function checkExistingActiveRental(dwellingId: number) {
  const [existingRental] = await db
    .select({ id: schema.rentalProperties.id })
    .from(schema.rentalProperties)
    .where(
      and(
        eq(schema.rentalProperties.dwellingId, dwellingId),
        eq(schema.rentalProperties.isActive, true)
      )
    )
    .limit(1);

  return !!existingRental;
}

/**
 * Membersihkan status koordinator lama ketika koordinator diganti di properti sewa.
 */
export async function cleanupOldCoordinatorStatus(oldCoordinatorId: string) {
  const activePropertiesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rentalProperties)
    .where(
      and(
        eq(schema.rentalProperties.coordinatorUserId, oldCoordinatorId),
        eq(schema.rentalProperties.isActive, true)
      )
    )
    .then((res) => Number(res[0]?.count || 0));

  if (activePropertiesCount === 0) {
    const [oldCoordinatorUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, oldCoordinatorId))
      .limit(1);

    if (oldCoordinatorUser && oldCoordinatorUser.roleId === 5) {
      const [isOwner] = await db
        .select({ id: schema.dwellings.id })
        .from(schema.dwellings)
        .where(eq(schema.dwellings.ownerUserId, oldCoordinatorId))
        .limit(1);

      if (!isOwner) {
        let isResident = false;
        if (oldCoordinatorUser.nik) {
          const [residentCheck] = await db
            .select()
            .from(schema.residents)
            .where(eq(schema.residents.nik, oldCoordinatorUser.nik))
            .limit(1);
          if (residentCheck) {
            isResident = true;
          }
        }

        if (isResident) {
          await db
            .update(schema.users)
            .set({ roleId: 6 })
            .where(eq(schema.users.id, oldCoordinatorId));
        } else {
          await db
            .update(schema.users)
            .set({ status: "suspended" })
            .where(eq(schema.users.id, oldCoordinatorId));
        }
      }
    }
  }
}

/**
 * Mengambil status kamar dan daftar penghuni aktif per kamar untuk suatu properti sewa.
 */
export async function getRentalPropertyRooms(propertyId: number, property: any) {
  let rooms: string[] = [];
  if (Array.isArray(property.roomList) && property.roomList.length > 0) {
    rooms = property.roomList as string[];
  } else {
    const total = property.totalRooms || 0;
    for (let i = 1; i <= total; i++) {
      rooms.push(i.toString().padStart(2, '0'));
    }
  }

  const activeResidents = await db
    .select({
      id: schema.residents.id,
      name: schema.residents.name,
      nik: schema.residents.nik,
      phone: schema.residents.phone,
      tenantType: schema.residents.residentType,
      roomNumber: schema.residents.roomNumber,
      checkInDate: schema.residents.checkInDate,
      verificationStatus: schema.residents.verificationStatus,
      verificationNote: schema.residents.verificationNote,
      ktpFile: schema.residents.ktpFile,
      originAddress: schema.residents.originAddress,
      occupation: schema.residents.occupation,
      educationLevel: schema.residents.educationLevel,
      religion: schema.residents.religion,
      isActive: schema.residents.isActive,
    })
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.rentalPropertyId, propertyId),
        eq(schema.residents.isActive, true)
      )
    );

  return rooms.map((roomNum) => {
    const roomResidentsRaw = activeResidents.filter(
      (r) => r.roomNumber === roomNum || (r.roomNumber === null && rooms.length === 1)
    );

    const roomResidents = roomResidentsRaw.map((r) => ({
      ...r,
      tenantType: r.tenantType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
    }));

    let status: 'vacant' | 'occupied' | 'sharing' = 'vacant';
    if (roomResidents.length === 1) {
      status = 'occupied';
    } else if (roomResidents.length > 1) {
      status = 'sharing';
    }

    return {
      roomNumber: roomNum,
      status,
      residentsCount: roomResidents.length,
      residents: roomResidents,
    };
  });
}

/**
 * Mengambil riwayat penghuni non-aktif untuk nomor kamar tertentu.
 */
export async function getRoomHistory(propertyId: number, roomNumber: string) {
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

  return historyRaw.map((h) => ({
    ...h,
    tenantType: h.tenantType === 'sewa_keluarga' ? ('keluarga' as const) : ('perorangan' as const),
  }));
}

/**
 * Membuat pendaftaran penghuni sewa keluarga (termasuk pendaftaran user, account, family, dan resident).
 */
export async function createFamilyRentalResident(
  validatedData: any,
  property: any,
  checkInDate: Date,
  sessionUserId: string,
  requestOrigin?: string
) {
  const existingUserByEmail = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, validatedData.email))
    .limit(1);
  if (existingUserByEmail.length > 0) {
    throw new Error(`Email ${validatedData.email} sudah terdaftar di sistem.`);
  }

  const existingUserByNik = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.nik, validatedData.nik))
    .limit(1);
  if (existingUserByNik.length > 0) {
    throw new Error(`NIK ${validatedData.nik} sudah terdaftar di sistem.`);
  }

  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(randomPassword);

  let residentId: number;

  await db.transaction(async (tx) => {
    const userId = crypto.randomUUID();

    await tx.insert(schema.users).values({
      id: userId,
      name: validatedData.name,
      email: validatedData.email!,
      password: hashedPassword,
      nik: validatedData.nik,
      phone: validatedData.phone || null,
      roleId: 6,
      status: 'active',
      dwellingId: property.dwellingId,
      unitNumber: validatedData.roomNumber || null,
    });

    await tx.insert(schema.accounts).values({
      id: crypto.randomUUID(),
      accountId: validatedData.email!,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
    });

    const [insertFamily] = await tx.insert(schema.families).values({
      dwellingId: property.dwellingId,
      familyNumber: validatedData.nik,
      headUserId: userId,
      headName: validatedData.name,
      unitNumber: validatedData.roomNumber || null,
      verificationStatus: 'draft',
      checkInDate: checkInDate,
      isActive: true,
    });
    const familyId = insertFamily.insertId;

    const [insertResident] = await tx.insert(schema.residents).values({
      rentalPropertyId: property.id,
      dwellingId: property.dwellingId,
      familyId: familyId,
      userId: userId,
      residentType: 'sewa_keluarga',
      relationship: 'Kepala_Keluarga',
      name: validatedData.name,
      nik: validatedData.nik,
      gender: 'L',
      phone: validatedData.phone || null,
      roomNumber: validatedData.roomNumber || null,
      checkInDate: checkInDate,
      ktpFile: null,
      verificationStatus: 'pending',
      createdBy: sessionUserId,
      isActive: true,
      notes: validatedData.notes || null,
    });
    residentId = insertResident.insertId;
  });

  const origin = requestOrigin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginLink = `${origin}/login`;
  try {
    await sendEmail({
      to: { email: validatedData.email, name: validatedData.name },
      subject: 'Akun Keluarga Penyewa Wargaku Berhasil Dibuat',
      htmlContent: getTenantFamilyWelcomeEmail(validatedData.name, validatedData.email, randomPassword, loginLink),
    });
  } catch (mailErr) {
    console.error('Gagal mengirim email kredensial penyewa:', mailErr);
  }

  return residentId!;
}

/**
 * Memperbarui data penghuni sewa dan sinkronisasi ke tabel families, residents (anggota), & users jika sewa_keluarga.
 */
export async function updateRentalResidentWithFamilySync(
  residentId: number,
  resident: any,
  validatedData: any,
  sessionUserId: string
) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.residents)
      .set({
        ...validatedData,
        updatedBy: sessionUserId,
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, residentId));

    if (resident.tenantType === 'keluarga' && resident.familyId) {
      const [family] = await tx
        .select()
        .from(schema.families)
        .where(eq(schema.families.id, resident.familyId));

      if (family) {
        const familyUpdates: any = { updatedAt: new Date() };
        if (validatedData.name) familyUpdates.headName = validatedData.name;
        if (validatedData.nik) familyUpdates.familyNumber = validatedData.nik;
        if (validatedData.roomNumber !== undefined) familyUpdates.unitNumber = validatedData.roomNumber || null;

        await tx
          .update(schema.families)
          .set(familyUpdates)
          .where(eq(schema.families.id, resident.familyId));

        const memberUpdates: any = { updatedAt: new Date() };
        if (validatedData.name) memberUpdates.name = validatedData.name;
        if (validatedData.nik) memberUpdates.nik = validatedData.nik;
        if (validatedData.phone !== undefined) memberUpdates.phone = validatedData.phone || null;

        await tx
          .update(schema.residents)
          .set(memberUpdates)
          .where(
            and(
              eq(schema.residents.familyId, resident.familyId),
              eq(schema.residents.relationship, 'Kepala_Keluarga')
            )
          );

        if (family.headUserId) {
          const userUpdates: any = { updatedAt: new Date() };
          if (validatedData.name) userUpdates.name = validatedData.name;
          if (validatedData.nik) userUpdates.nik = validatedData.nik;
          if (validatedData.phone !== undefined) userUpdates.phone = validatedData.phone || null;
          if (validatedData.roomNumber !== undefined) userUpdates.unitNumber = validatedData.roomNumber || null;

          await tx
            .update(schema.users)
            .set(userUpdates)
            .where(eq(schema.users.id, family.headUserId));
        }
      }
    }
  });
}

/**
 * Menghapus penghuni sewa dan cascade delete ke families, residents, accounts, & users jika sewa_keluarga.
 */
export async function deleteRentalResidentWithCascade(residentId: number, resident: any) {
  await db.transaction(async (tx) => {
    await tx.delete(schema.residents).where(eq(schema.residents.id, residentId));

    if (resident.tenantType === 'keluarga' && resident.familyId) {
      const [family] = await tx
        .select()
        .from(schema.families)
        .where(eq(schema.families.id, resident.familyId));

      await tx
        .delete(schema.residents)
        .where(and(eq(schema.residents.familyId, resident.familyId), eq(schema.residents.residentType, 'warga_tetap')));

      await tx
        .delete(schema.families)
        .where(eq(schema.families.id, resident.familyId));

      if (family && family.headUserId) {
        await tx.delete(schema.accounts).where(eq(schema.accounts.userId, family.headUserId));
        await tx.delete(schema.users).where(eq(schema.users.id, family.headUserId));
      }
    }
  });
}

/**
 * Mengaktifkan kembali penghuni sewa dan cascade reactivate families, residents, & users jika sewa_keluarga.
 */
export async function reactivateRentalResidentWithCascade(
  residentId: number,
  resident: any,
  sessionUserId: string
) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.residents)
      .set({
        isActive: true,
        checkOutDate: null,
        inactiveReason: null,
        updatedBy: sessionUserId,
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, residentId));

    if (resident.tenantType === 'keluarga' && resident.familyId) {
      const [family] = await tx
        .select()
        .from(schema.families)
        .where(eq(schema.families.id, resident.familyId));

      if (family) {
        await tx
          .update(schema.families)
          .set({
            isActive: true,
            checkOutDate: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.families.id, resident.familyId));

        await tx
          .update(schema.residents)
          .set({
            isActive: true,
            inactiveReason: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.residents.familyId, resident.familyId),
              eq(schema.residents.residentType, 'warga_tetap')
            )
          );

        if (family.headUserId) {
          await tx
            .update(schema.users)
            .set({
              status: 'active',
              dwellingId: resident.dwellingId,
              unitNumber: resident.roomNumber || null,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, family.headUserId));
        }
      }
    }
  });
}

/**
 * Memproses check-out (penonaktifan) penghuni sewa dan cascade ke families, residents, & users.
 */
export async function checkOutRentalResidentWithCascade(
  residentId: number,
  resident: any,
  validatedData: { checkOutDate: string | Date; inactiveReason: 'pindah' | 'meninggal' | 'check_out'; notes?: string | null },
  sessionUserId: string
) {
  const checkOutDateObj = validatedData.checkOutDate instanceof Date
    ? validatedData.checkOutDate
    : new Date(String(validatedData.checkOutDate));

  await db.transaction(async (tx) => {
    await tx
      .update(schema.residents)
      .set({
        isActive: false,
        checkOutDate: checkOutDateObj,
        inactiveReason: validatedData.inactiveReason,
        notes: validatedData.notes,
        updatedBy: sessionUserId,
      })
      .where(eq(schema.residents.id, residentId));

    if (resident.tenantType === 'keluarga' && resident.familyId) {
      const [family] = await tx
        .select()
        .from(schema.families)
        .where(eq(schema.families.id, resident.familyId));

      if (family) {
        await tx
          .update(schema.families)
          .set({
            isActive: false,
            checkOutDate: checkOutDateObj,
            updatedAt: new Date(),
          })
          .where(eq(schema.families.id, resident.familyId));

        await tx
          .update(schema.residents)
          .set({
            isActive: false,
            inactiveReason: 'pindah',
            updatedAt: new Date(),
          })
          .where(and(eq(schema.residents.familyId, resident.familyId), eq(schema.residents.residentType, 'warga_tetap')));

        if (family.headUserId) {
          await tx
            .update(schema.users)
            .set({
              status: 'suspended',
              dwellingId: null,
              unitNumber: null,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, family.headUserId));
        }
      }
    }
  });
}



