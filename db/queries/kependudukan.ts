import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { createFamilySchema, updateFamilySchema, createWargaSchema, updateWargaSchema } from '@/lib/validations/kependudukan';
import { z } from 'zod';

// ==========================================
// KARTU KELUARGA (FAMILIES) CRUD QUERIES
// ==========================================

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;

/**
 * Membuat Kartu Keluarga (KK) baru.
 * Di dalam transaksi, otomatis menambahkan data Warga pertama (Kepala Keluarga)
 * dengan menarik NIK dari tabel users berdasarkan headUserId.
 */
export async function createFamily(data: CreateFamilyInput) {
  // Validasi input dengan Zod
  const validated = createFamilySchema.parse(data);

  return await db.transaction(async (tx) => {
    // 1. Ambil data user kepala keluarga untuk mendapatkan NIK-nya
    const [user] = await tx
      .select({
        name: schema.users.name,
        nik: schema.users.nik,
        phone: schema.users.phone,
      })
      .from(schema.users)
      .where(eq(schema.users.id, validated.headUserId))
      .limit(1);

    if (!user) {
      throw new Error(`User dengan ID ${validated.headUserId} tidak ditemukan.`);
    }

    if (!user.nik) {
      throw new Error(`User kepala keluarga dengan ID ${validated.headUserId} belum memiliki NIK yang terdaftar.`);
    }

    // 2. Insert data keluarga
    const [insertResult] = await tx.insert(schema.families).values({
      dwellingId: validated.dwellingId,
      familyNumber: validated.familyNumber,
      headUserId: validated.headUserId,
      headName: validated.headName,
      unitNumber: validated.unitNumber,
      kkFile: validated.kkFile,
      checkInDate: validated.checkInDate,
      checkOutDate: validated.checkOutDate,
      verificationStatus: 'pending',
      isActive: true,
    });

    const familyId = insertResult.insertId;

    // 3. Masukkan Kepala Keluarga secara otomatis sebagai anggota keluarga pertama
    await tx.insert(schema.familyMembers).values({
      familyId,
      name: user.name,
      nik: user.nik,
      relationship: 'Kepala_Keluarga',
      gender: 'L', // Nilai default, wajib diisi NOT NULL. Warga harus melengkapinya via edit profil.
      phone: user.phone || null,
      isActive: true,
    });

    return familyId;
  });
}

export async function getFamilyById(id: number) {
  try {
    const [family] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.id, id))
      .limit(1);

    if (!family) return null;

    // Ambil anggota keluarga secara manual untuk memastikan
    const members = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.familyId, id));

    const [dwelling] = await db
      .select()
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, family.dwellingId))
      .limit(1);

    return {
      ...family,
      dwelling: dwelling || null,
      members,
    };
  } catch (error) {
    console.error('Error in getFamilyById:', error);
    throw new Error('Gagal mengambil data Kartu Keluarga');
  }
}


/**
 * Mengambil KK berdasarkan nomor Kartu Keluarga.
 */
export async function getFamilyByNumber(familyNumber: string) {
  try {
    const [family] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.familyNumber, familyNumber))
      .limit(1);

    return family || null;
  } catch (error) {
    console.error('Error in getFamilyByNumber:', error);
    throw new Error('Gagal mengambil data Kartu Keluarga berdasarkan nomor KK');
  }
}

/**
 * Mengambil KK berdasarkan headUserId (Kepala Keluarga).
 */
export async function getFamilyByHeadUserId(headUserId: number) {
  try {
    const [family] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.headUserId, headUserId))
      .limit(1);

    return family || null;
  } catch (error) {
    console.error('Error in getFamilyByHeadUserId:', error);
    throw new Error('Gagal mengambil data Kartu Keluarga berdasarkan User Kepala Keluarga');
  }
}

/**
 * Mengambil daftar Kartu Keluarga terpaginasi dengan filter pencarian dan status.
 */
export async function listFamilies(options: {
  limit?: number;
  offset?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  isActive?: boolean;
  query?: string;
} = {}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions = [];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.families.isActive, options.isActive));
    }
    if (options.verificationStatus !== undefined) {
      conditions.push(eq(schema.families.verificationStatus, options.verificationStatus));
    }
    if (options.query) {
      conditions.push(
        or(
          like(schema.families.familyNumber, `%${options.query}%`),
          like(schema.families.headName, `%${options.query}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Ambil data families
    const data = await db
      .select()
      .from(schema.families)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.families.createdAt));

    // Hitung total data untuk pagination
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.families)
      .where(whereClause);

    // Ambil sql import helper
    // Catatan: Jika drizzle-orm tidak mengekspor sql secara langsung di typescript bundler, 
    // kita bisa mengimpor `sql` dari 'drizzle-orm' secara dinamis atau menggunakan import.
    
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
    console.error('Error in listFamilies:', error);
    throw new Error('Gagal mengambil daftar Kartu Keluarga');
  }
}

/**
 * Memperbarui data Kartu Keluarga.
 */
export async function updateFamily(id: number, data: UpdateFamilyInput) {
  const validated = updateFamilySchema.parse(data);

  try {
    await db
      .update(schema.families)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, id));

    return true;
  } catch (error) {
    console.error('Error in updateFamily:', error);
    throw new Error('Gagal memperbarui data Kartu Keluarga');
  }
}

/**
 * Soft delete Kartu Keluarga (menonaktifkan KK).
 * Mengubah isActive menjadi false dan checkOutDate menjadi hari ini.
 */
export async function deleteFamily(id: number) {
  try {
    await db.transaction(async (tx) => {
      // 1. Nonaktifkan keluarga
      await tx
        .update(schema.families)
        .set({
          isActive: false,
          checkOutDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.families.id, id));

      // 2. Otomatis nonaktifkan semua anggota keluarga di dalamnya
      await tx
        .update(schema.familyMembers)
        .set({
          isActive: false,
          inactiveReason: 'pindah',
          updatedAt: new Date(),
        })
        .where(eq(schema.familyMembers.familyId, id));
    });

    return true;
  } catch (error) {
    console.error('Error in deleteFamily:', error);
    throw new Error('Gagal melakukan penonaktifan Kartu Keluarga');
  }
}


// ==========================================
// WARGA / ANGGOTA KELUARGA (FAMILY MEMBERS) CRUD QUERIES
// ==========================================

export type CreateWargaInput = z.infer<typeof createWargaSchema>;
export type UpdateWargaInput = z.infer<typeof updateWargaSchema>;

/**
 * Menambahkan anggota keluarga baru.
 * Melakukan pemeriksaan keunikan NIK terlebih dahulu.
 */
export async function createFamilyMember(data: CreateWargaInput) {
  const validated = createWargaSchema.parse(data);

  // Periksa keunikan NIK
  const existingWarga = await getFamilyMemberByNik(validated.nik);
  if (existingWarga) {
    throw new Error(`NIK ${validated.nik} sudah terdaftar di sistem kependudukan.`);
  }

  try {
    const [insertResult] = await db.insert(schema.familyMembers).values({
      familyId: validated.familyId,
      name: validated.name,
      nik: validated.nik,
      birthPlace: validated.birthPlace,
      birthDate: validated.birthDate,
      gender: validated.gender,
      relationship: validated.relationship,
      occupation: validated.occupation,
      educationLevel: validated.educationLevel,
      phone: validated.phone,
      ktpFile: validated.ktpFile,
      isActive: true,
    });

    return insertResult.insertId;
  } catch (error) {
    console.error('Error in createFamilyMember:', error);
    throw new Error('Gagal menambahkan data anggota keluarga');
  }
}

/**
 * Mengambil data warga berdasarkan ID.
 */
export async function getFamilyMemberById(id: number) {
  try {
    const [member] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, id))
      .limit(1);

    return member || null;
  } catch (error) {
    console.error('Error in getFamilyMemberById:', error);
    throw new Error('Gagal mengambil data anggota keluarga berdasarkan ID');
  }
}

/**
 * Mengambil data warga berdasarkan NIK.
 */
export async function getFamilyMemberByNik(nik: string) {
  try {
    const [member] = await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.nik, nik))
      .limit(1);

    return member || null;
  } catch (error) {
    console.error('Error in getFamilyMemberByNik:', error);
    throw new Error('Gagal mengambil data warga berdasarkan NIK');
  }
}

/**
 * Mengambil seluruh anggota keluarga yang terdaftar dalam satu KK.
 */
export async function getFamilyMembersByFamilyId(familyId: number) {
  try {
    return await db
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.familyId, familyId));
  } catch (error) {
    console.error('Error in getFamilyMembersByFamilyId:', error);
    throw new Error('Gagal mengambil daftar anggota keluarga');
  }
}

/**
 * Mengambil daftar warga terpaginasi dengan pencarian (Nama / NIK) dan filter.
 */
export async function listFamilyMembers(options: {
  limit?: number;
  offset?: number;
  gender?: 'L' | 'P';
  relationship?: 'Kepala_Keluarga' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Lainnya';
  isActive?: boolean;
  query?: string;
} = {}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions = [];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.familyMembers.isActive, options.isActive));
    }
    if (options.gender !== undefined) {
      conditions.push(eq(schema.familyMembers.gender, options.gender));
    }
    if (options.relationship !== undefined) {
      conditions.push(eq(schema.familyMembers.relationship, options.relationship));
    }
    if (options.query) {
      conditions.push(
        or(
          like(schema.familyMembers.name, `%${options.query}%`),
          like(schema.familyMembers.nik, `%${options.query}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(schema.familyMembers)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.familyMembers.createdAt));

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.familyMembers)
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
    console.error('Error in listFamilyMembers:', error);
    throw new Error('Gagal mengambil daftar warga');
  }
}

/**
 * Memperbarui data warga / anggota keluarga.
 */
export async function updateFamilyMember(id: number, data: UpdateWargaInput) {
  const validated = updateWargaSchema.parse(data);

  try {
    await db
      .update(schema.familyMembers)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(schema.familyMembers.id, id));

    return true;
  } catch (error) {
    console.error('Error in updateFamilyMember:', error);
    throw new Error('Gagal memperbarui data warga');
  }
}

/**
 * Soft delete warga (menonaktifkan warga) dengan mencantumkan alasan (pindah / meninggal).
 */
export async function deleteFamilyMember(id: number, inactiveReason: 'pindah' | 'meninggal') {
  try {
    await db
      .update(schema.familyMembers)
      .set({
        isActive: false,
        inactiveReason,
        updatedAt: new Date(),
      })
      .where(eq(schema.familyMembers.id, id));

    return true;
  } catch (error) {
    console.error('Error in deleteFamilyMember:', error);
    throw new Error('Gagal melakukan penonaktifan warga');
  }
}
