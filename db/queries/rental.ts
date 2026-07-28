import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, type SQL } from 'drizzle-orm';
import {
  createRentalPropertySchema,
  updateRentalPropertySchema,
  createRentalResidentSchema,
  updateRentalResidentSchema,
} from '@/lib/validations/rental';
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
