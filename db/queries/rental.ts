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
    if (options.query) {
      conditions.push(like(schema.rentalProperties.name, `%${options.query}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(schema.rentalProperties)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.rentalProperties.createdAt));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.rentalProperties)
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
      .from(schema.rentalResidents)
      .where(
        and(
          eq(schema.rentalResidents.rentalPropertyId, id),
          eq(schema.rentalResidents.isActive, true)
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
    const [insertResult] = await db.insert(schema.rentalProperties).values({
      dwellingId: validated.dwellingId,
      name: validated.name,
      coordinatorUserId: validated.coordinatorUserId,
      contactPerson: validated.contactPerson,
      phone: validated.phone,
      totalRooms: validated.totalRooms,
      isActive: true,
    });
    return insertResult.insertId;
  } catch (error) {
    console.error('Error in createRentalProperty:', error);
    throw new Error('Gagal membuat properti sewa baru');
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

    const conditions: (SQL | undefined)[] = [eq(schema.rentalResidents.rentalPropertyId, options.rentalPropertyId)];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.rentalResidents.isActive, options.isActive));
    }
    if (options.query) {
      conditions.push(
        or(
          like(schema.rentalResidents.name, `%${options.query}%`),
          like(schema.rentalResidents.nik, `%${options.query}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    const data = await db
      .select()
      .from(schema.rentalResidents)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.rentalResidents.createdAt));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.rentalResidents)
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
      .from(schema.rentalResidents)
      .where(eq(schema.rentalResidents.id, id))
      .limit(1);

    return resident || null;
  } catch (error) {
    console.error('Error in getRentalResidentById:', error);
    throw new Error('Gagal mengambil detail data penghuni');
  }
}

export async function getRentalResidentByNik(nik: string) {
  try {
    const [resident] = await db
      .select()
      .from(schema.rentalResidents)
      .where(eq(schema.rentalResidents.nik, nik))
      .limit(1);

    return resident || null;
  } catch (error) {
    console.error('Error in getRentalResidentByNik:', error);
    throw new Error('Gagal mengambil data penghuni berdasarkan NIK');
  }
}

export async function createRentalResident(data: CreateRentalResidentInput & { rentalPropertyId: number; createdBy: string }) {
  // Parsing menggunakan validation schema
  const validated = createRentalResidentSchema.parse(data);
  try {
    const [insertResult] = await db.insert(schema.rentalResidents).values({
      rentalPropertyId: data.rentalPropertyId, // Wajib disertakan, divalidasi manual di endpoint/controller
      tenantType: validated.tenantType,
      familyId: validated.familyId,
      name: validated.name,
      nik: validated.nik,
      phone: validated.phone,
      originAddress: validated.originAddress,
      occupation: validated.occupation,
      educationLevel: validated.educationLevel,
      roomNumber: validated.roomNumber,
      checkInDate: validated.checkInDate,
      ktpFile: validated.ktpFile,
      verificationStatus: 'pending',
      createdBy: data.createdBy,
      isActive: true,
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
    const updateData: any = {
      ...validated,
      updatedAt: new Date(),
    };
    if (data.updatedBy) {
      updateData.updatedBy = data.updatedBy;
    }
    
    await db
      .update(schema.rentalResidents)
      .set(updateData)
      .where(eq(schema.rentalResidents.id, id));
    return true;
  } catch (error) {
    console.error('Error in updateRentalResident:', error);
    throw new Error('Gagal memperbarui data penghuni');
  }
}

export async function deleteRentalResident(id: number) {
  try {
    await db.delete(schema.rentalResidents).where(eq(schema.rentalResidents.id, id));
    return true;
  } catch (error) {
    console.error('Error in deleteRentalResident:', error);
    throw new Error('Gagal menghapus data penghuni');
  }
}
