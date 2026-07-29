import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, ne, and, or, like, desc, sql, type SQL } from 'drizzle-orm';
import { createFamilySchema, updateFamilySchema, createWargaSchema, updateWargaSchema } from '@/lib/validations/kependudukan';
import { z } from 'zod';
import { randomUUID } from 'crypto';

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
      verificationStatus: 'verified',
      hasVerified: true,
      lastVerifiedAt: new Date(),
      isActive: true,
    });

    const familyId = insertResult.insertId;

    // 3. Masukkan Kepala Keluarga secara otomatis sebagai anggota keluarga pertama
    await tx.insert(schema.residents).values({
      familyId,
      dwellingId: validated.dwellingId,
      residentType: 'warga_tetap',
      name: user.name,
      nik: user.nik,
      relationship: 'Kepala_Keluarga',
      gender: 'L', // Nilai default, wajib diisi NOT NULL. Warga harus melengkapinya via edit profil.
      phone: user.phone || null,
      verificationStatus: 'verified',
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
      .from(schema.residents)
      .where(and(eq(schema.residents.familyId, id), eq(schema.residents.residentType, 'warga_tetap')));

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
export async function getFamilyByHeadUserId(headUserId: string) {
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
  verificationStatus?: 'draft' | 'pending' | 'verified' | 'rejected';
  hasVerified?: boolean;
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
    if (options.hasVerified !== undefined) {
      conditions.push(eq(schema.families.hasVerified, options.hasVerified));
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

    // Subquery untuk menghitung jumlah anggota keluarga aktif per KK
    const memberCountSubquery = db
      .select({
        familyId: schema.residents.familyId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(schema.residents)
      .where(and(eq(schema.residents.isActive, true), eq(schema.residents.residentType, 'warga_tetap')))
      .groupBy(schema.residents.familyId)
      .as('mc');

    // Ambil data families dengan detail alamat hunian dan jumlah anggota
    const data = await db
      .select({
        id: schema.families.id,
        dwellingId: schema.families.dwellingId,
        familyNumber: schema.families.familyNumber,
        headUserId: schema.families.headUserId,
        headName: schema.families.headName,
        unitNumber: schema.families.unitNumber,
        kkFile: schema.families.kkFile,
        verificationStatus: schema.families.verificationStatus,
        verificationNote: schema.families.verificationNote,
        checkInDate: schema.families.checkInDate,
        checkOutDate: schema.families.checkOutDate,
        isActive: schema.families.isActive,
        createdAt: schema.families.createdAt,
        updatedAt: schema.families.updatedAt,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        dwellingType: schema.dwellings.type,
        memberCount: sql<number>`COALESCE(${memberCountSubquery.count}, 0)`.mapWith(Number)
      })
      .from(schema.families)
      .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
      .leftJoin(memberCountSubquery, eq(schema.families.id, memberCountSubquery.familyId))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.families.createdAt));

    // Hitung total data untuk pagination
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(schema.families)
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
        .update(schema.residents)
        .set({
          isActive: false,
          inactiveReason: 'pindah',
          updatedAt: new Date(),
        })
        .where(and(eq(schema.residents.familyId, id), eq(schema.residents.residentType, 'warga_tetap')));
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
    const [insertResult] = await db.insert(schema.residents).values({
      familyId: validated.familyId,
      residentType: 'warga_tetap',
      name: validated.name,
      nik: validated.nik,
      birthPlace: validated.birthPlace,
      birthDate: validated.birthDate,
      gender: validated.gender,
      relationship: validated.relationship as any,
      occupation: validated.occupation,
      educationLevel: validated.educationLevel,
      phone: validated.phone,
      ktpFile: validated.ktpFile,
      verificationStatus: 'verified',
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
      .from(schema.residents)
      .where(eq(schema.residents.id, id))
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
      .from(schema.residents)
      .where(eq(schema.residents.nik, nik))
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
      .from(schema.residents)
      .where(and(eq(schema.residents.familyId, familyId), eq(schema.residents.residentType, 'warga_tetap')));
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
  relationship?: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Lainnya';
  isActive?: boolean;
  query?: string;
} = {}) {
  try {
    const limit = options.limit ?? 10;
    const offset = options.offset ?? 0;

    const conditions: (SQL | undefined)[] = [eq(schema.residents.residentType, 'warga_tetap')];

    if (options.isActive !== undefined) {
      conditions.push(eq(schema.residents.isActive, options.isActive));
    }
    if (options.gender !== undefined) {
      conditions.push(eq(schema.residents.gender, options.gender));
    }
    if (options.relationship !== undefined) {
      conditions.push(eq(schema.residents.relationship, options.relationship));
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

    const data = await db
      .select()
      .from(schema.residents)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.residents.createdAt));

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
      .update(schema.residents)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, id));

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
      .update(schema.residents)
      .set({
        isActive: false,
        inactiveReason,
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, id));

    return true;
  } catch (error) {
    console.error('Error in deleteFamilyMember:', error);
    throw new Error('Gagal melakukan penonaktifan warga');
  }
}

export async function transferFamilyMember(data: {
  memberId: number;
  relationship: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Lainnya';
  createNewFamily: boolean;
  targetFamilyId?: number | null;
  familyNumber?: string | null;
  dwellingId?: number | null;
  unitNumber?: string | null;
  checkInDate?: Date | null;
}) {
  return await db.transaction(async (tx) => {
    // 1. Dapatkan data member yang mau dipindahkan
    const [member] = await tx
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, data.memberId))
      .limit(1);

    if (!member) {
      throw new Error(`Anggota keluarga dengan ID ${data.memberId} tidak ditemukan.`);
    }

    let finalFamilyId = data.targetFamilyId;

    if (data.createNewFamily) {
      if (!data.familyNumber || !data.dwellingId) {
        throw new Error('Nomor KK dan ID Tempat Tinggal wajib diisi untuk membuat KK baru.');
      }

      // Pastikan NIK member ini unik di users jika ingin dikaitkan ke KK baru
      const [existingUser] = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.nik, member.nik))
        .limit(1);

      let headUserId = existingUser?.id;

      if (!headUserId) {
        // Cari role ID untuk 'warga'
        const [wargaRole] = await tx
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(eq(schema.roles.slug, 'warga'))
          .limit(1);

        if (!wargaRole) {
          throw new Error('Role "warga" tidak ditemukan di database.');
        }

        // Buat user pasif baru
        const newUserId = randomUUID();
        await tx.insert(schema.users).values({
          id: newUserId,
          name: member.name,
          email: `${member.nik}@wargaku.local`,
          nik: member.nik,
          phone: member.phone,
          roleId: wargaRole.id,
          status: 'active',
        });
        headUserId = newUserId;
      }

      // Pastikan nomor KK belum terdaftar di database
      const [existingFamily] = await tx
        .select()
        .from(schema.families)
        .where(eq(schema.families.familyNumber, data.familyNumber))
        .limit(1);

      if (existingFamily) {
        throw new Error(`Nomor KK ${data.familyNumber} sudah terdaftar.`);
      }

      // Buat KK Baru
      const [insertResult] = await tx.insert(schema.families).values({
        dwellingId: data.dwellingId,
        familyNumber: data.familyNumber,
        headUserId: headUserId,
        headName: member.name,
        unitNumber: data.unitNumber || null,
        checkInDate: data.checkInDate || new Date(),
        verificationStatus: 'verified', // Karena dibuat oleh RT langsung
        isActive: true,
      });

      finalFamilyId = insertResult.insertId;
    }

    if (!finalFamilyId) {
      throw new Error('ID Kartu Keluarga tujuan tidak valid.');
    }

    // 2. Jika dipindahkan, update familyId dan relationship di residents
    await tx
      .update(schema.residents)
      .set({
        familyId: finalFamilyId,
        relationship: data.relationship,
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, data.memberId));

    // Jika member dipindahkan menjadi Kepala Keluarga pada KK tujuan, pastikan tabel families juga terupdate
    if (data.relationship === 'Kepala_Keluarga') {
      const [existingUser] = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.nik, member.nik))
        .limit(1);

      let headUserId = existingUser?.id;

      if (!headUserId) {
        const [wargaRole] = await tx
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(eq(schema.roles.slug, 'warga'))
          .limit(1);

        const newUserId = randomUUID();
        await tx.insert(schema.users).values({
          id: newUserId,
          name: member.name,
          email: `${member.nik}@wargaku.local`,
          nik: member.nik,
          phone: member.phone,
          roleId: wargaRole?.id || 1,
          status: 'active',
        });
        headUserId = newUserId;
      }

      await tx
        .update(schema.families)
        .set({
          headUserId: headUserId,
          headName: member.name,
          updatedAt: new Date(),
        })
        .where(eq(schema.families.id, finalFamilyId));
    }

    return finalFamilyId;
  });
}

export async function changeFamilyHead(data: {
  familyId: number;
  newHeadMemberId: number;
  oldHeadAction: 'suspend' | 'pindah' | 'none';
  newHeadEmail?: string | null;
}) {
  return await db.transaction(async (tx) => {
    // 1. Ambil KK
    const [family] = await tx
      .select()
      .from(schema.families)
      .where(eq(schema.families.id, data.familyId))
      .limit(1);

    if (!family) {
      throw new Error(`Kartu Keluarga dengan ID ${data.familyId} tidak ditemukan.`);
    }

    // 2. Ambil anggota keluarga terpilih (calon kepala keluarga baru)
    const [newHeadMember] = await tx
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, data.newHeadMemberId))
      .limit(1);

    if (!newHeadMember) {
      throw new Error(`Anggota keluarga dengan ID ${data.newHeadMemberId} tidak ditemukan.`);
    }

    if (newHeadMember.familyId !== data.familyId) {
      throw new Error('Anggota keluarga terpilih tidak berada dalam Kartu Keluarga ini.');
    }

    // 3. Cari/buat user login untuk Kepala Keluarga Baru
    const [newHeadUser] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.nik, newHeadMember.nik))
      .limit(1);

    let headUserId = newHeadUser?.id;

    if (!headUserId) {
      const [wargaRole] = await tx
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(eq(schema.roles.slug, 'warga'))
        .limit(1);

      if (!wargaRole) {
        throw new Error('Role "warga" tidak ditemukan.');
      }

      const email = data.newHeadEmail && data.newHeadEmail.trim() !== '' 
        ? data.newHeadEmail 
        : `${newHeadMember.nik}@wargaku.local`;

      const newUserId = randomUUID();
      await tx.insert(schema.users).values({
        id: newUserId,
        name: newHeadMember.name,
        email: email,
        nik: newHeadMember.nik,
        phone: newHeadMember.phone,
        roleId: wargaRole.id,
        status: 'active',
      });
      headUserId = newUserId;
    } else if (data.newHeadEmail && data.newHeadEmail.trim() !== '') {
      // Update email jika diinput baru
      await tx
        .update(schema.users)
        .set({ email: data.newHeadEmail, updatedAt: new Date() })
        .where(eq(schema.users.id, headUserId));
    }

    // 4. Proses Kepala Keluarga Lama
    const oldHeadUserId = family.headUserId;
    
    // Cari member record Kepala Keluarga Lama di KK ini
    const [oldHeadMember] = await tx
      .select()
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.familyId, data.familyId),
          eq(schema.residents.relationship, 'Kepala_Keluarga')
        )
      )
      .limit(1);

    if (data.oldHeadAction === 'suspend') {
      // Suspend akun kepala keluarga lama
      await tx
        .update(schema.users)
        .set({
          status: 'suspended',
          nik: null, // Bebaskan NIK
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, oldHeadUserId));

      if (oldHeadMember) {
        await tx
          .update(schema.residents)
          .set({
            isActive: false,
            inactiveReason: 'meninggal',
            updatedAt: new Date(),
          })
          .where(eq(schema.residents.id, oldHeadMember.id));
      }
    } else if (data.oldHeadAction === 'pindah') {
      // Tandai tidak aktif (pindah) di KK ini, tapi jangan suspend akun users-nya agar dia bisa login di KK barunya nanti
      if (oldHeadMember) {
        await tx
          .update(schema.residents)
          .set({
            isActive: false,
            inactiveReason: 'pindah',
            updatedAt: new Date(),
          })
          .where(eq(schema.residents.id, oldHeadMember.id));
      }
    } else if (data.oldHeadAction === 'none') {
      // Hanya ganti hubungannya menjadi 'Lainnya' di KK ini (dia tetap tinggal di KK ini tapi bukan kepala lagi)
      if (oldHeadMember) {
        await tx
          .update(schema.residents)
          .set({
            relationship: 'Lainnya',
            updatedAt: new Date(),
          })
          .where(eq(schema.residents.id, oldHeadMember.id));
      }
    }

    // 5. Update data Kepala Keluarga Baru di KK (families) & familyMembers
    await tx
      .update(schema.residents)
      .set({
        relationship: 'Kepala_Keluarga',
        updatedAt: new Date(),
      })
      .where(eq(schema.residents.id, data.newHeadMemberId));

    await tx
      .update(schema.families)
      .set({
        headUserId: headUserId,
        headName: newHeadMember.name,
        verificationStatus: 'pending', // Paksa upload ulang KK baru
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, data.familyId));

    return true;
  });
}

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

export interface CreateDwellingsBulkInput {
  blockNumber: string;
  startNumber: number;
  endNumber: number;
  type: 'permanen' | 'kos' | 'homestay';
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

export async function createDwelling(data: CreateDwellingInput) {
  const [result] = await db.insert(schema.dwellings).values({
    blockNumber: data.blockNumber,
    houseNumber: data.houseNumber,
    type: data.type,
    qrToken: `qr-dwelling-${randomUUID()}`,
    isActive: true,
    notes: data.notes || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    ownerUserId: data.ownerUserId || null,
    ownerName: data.ownerName || null,
    ownerPhone: data.ownerPhone || null,
  });
  return result.insertId;
}

export async function createDwellingsBulk(data: CreateDwellingsBulkInput) {
  return await db.transaction(async (tx) => {
    const dwellingsInserted = [];
    for (let num = data.startNumber; num <= data.endNumber; num++) {
      const houseNumber = String(num);
      
      const [existing] = await tx
        .select({ id: schema.dwellings.id })
        .from(schema.dwellings)
        .where(
          and(
            eq(schema.dwellings.blockNumber, data.blockNumber),
            eq(schema.dwellings.houseNumber, houseNumber)
          )
        )
        .limit(1);

      if (!existing) {
        const [result] = await tx.insert(schema.dwellings).values({
          blockNumber: data.blockNumber,
          houseNumber: houseNumber,
          type: data.type,
          qrToken: `qr-dwelling-${randomUUID()}`,
          isActive: true,
        });
        dwellingsInserted.push(result.insertId);
      }
    }
    return dwellingsInserted;
  });
}

export async function updateDwelling(id: number, data: UpdateDwellingInput) {
  await db
    .update(schema.dwellings)
    .set({
      blockNumber: data.blockNumber,
      houseNumber: data.houseNumber,
      type: data.type,
      isActive: data.isActive !== undefined ? data.isActive : true,
      notes: data.notes || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      ownerUserId: data.ownerUserId || null,
      ownerName: data.ownerName || null,
      ownerPhone: data.ownerPhone || null,
    })
    .where(eq(schema.dwellings.id, id));
  return true;
}

export async function deleteDwelling(id: number) {
  await db
    .update(schema.dwellings)
    .set({ isActive: false })
    .where(eq(schema.dwellings.id, id));
  return true;
}

export interface ListDwellingsOptions {
  limit?: number;
  offset?: number;
  query?: string;
  type?: 'permanen' | 'kos' | 'homestay';
  isActive?: boolean;
}

export async function listDwellingsAdmin(options: ListDwellingsOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  
  let whereClause = undefined;
  const conditions = [];

  if (options.isActive !== undefined) {
    conditions.push(eq(schema.dwellings.isActive, options.isActive));
  }
  if (options.type) {
    conditions.push(eq(schema.dwellings.type, options.type));
  }
  if (options.query) {
    const searchVal = `%${options.query}%`;
    conditions.push(
      or(
        like(schema.dwellings.blockNumber, searchVal),
        like(schema.dwellings.houseNumber, searchVal),
        like(schema.dwellings.notes, searchVal)
      )
    );
  }

  if (conditions.length > 0) {
    whereClause = and(...conditions);
  }

  const data = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      ownerUserId: schema.dwellings.ownerUserId,
      ownerName: schema.dwellings.ownerName,
      ownerPhone: schema.dwellings.ownerPhone,
      qrToken: schema.dwellings.qrToken,
      latitude: schema.dwellings.latitude,
      longitude: schema.dwellings.longitude,
      type: schema.dwellings.type,
      isActive: schema.dwellings.isActive,
      notes: schema.dwellings.notes,
      createdAt: schema.dwellings.createdAt,
      totalRooms: schema.rentalProperties.totalRooms,
      occupiedRooms: sql<number>`(
        SELECT COUNT(*)
        FROM residents r
        WHERE r.rental_property_id = ${schema.rentalProperties.id}
          AND r.is_active = true
      )`.mapWith(Number),
    })
    .from(schema.dwellings)
    .leftJoin(
      schema.rentalProperties,
      eq(schema.dwellings.id, schema.rentalProperties.dwellingId)
    )
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.dwellings.createdAt));

  const [totalResult] = await db
    .select({ count: sql`count(*)` })
    .from(schema.dwellings)
    .where(whereClause);

  const total = Number(totalResult?.count ?? 0);

  return {
    data,
    metadata: {
      total,
      limit,
      offset,
    },
  };
}

export const getDwellingById = getDwellingDetailById;

export async function getDwellingDetailById(id: number) {
  const [dwelling] = await db
    .select()
    .from(schema.dwellings)
    .where(eq(schema.dwellings.id, id))
    .limit(1);

  if (!dwelling) return null;

  if (dwelling.type === 'permanen') {
    const activeFamilies = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        headName: schema.families.headName,
        unitNumber: schema.families.unitNumber,
        checkInDate: schema.families.checkInDate,
        verificationStatus: schema.families.verificationStatus,
      })
      .from(schema.families)
      .where(
        and(
          eq(schema.families.dwellingId, id),
          eq(schema.families.isActive, true)
        )
      );

    const familiesWithMemberCount = await Promise.all(
      activeFamilies.map(async (fam) => {
        const [memberCountRes] = await db
          .select({ count: sql`count(*)` })
          .from(schema.residents)
          .where(
            and(
              eq(schema.residents.familyId, fam.id),
              eq(schema.residents.residentType, 'warga_tetap'),
              eq(schema.residents.isActive, true)
            )
          );
        return {
          ...fam,
          memberCount: Number(memberCountRes?.count ?? 0),
        };
      })
    );

    return {
      ...dwelling,
      families: familiesWithMemberCount,
    };
  }

  if (dwelling.type === 'kos' || dwelling.type === 'homestay') {
    const [property] = await db
      .select()
      .from(schema.rentalProperties)
      .where(
        and(
          eq(schema.rentalProperties.dwellingId, id),
          eq(schema.rentalProperties.isActive, true)
        )
      )
      .limit(1);

    if (property) {
      let coordinator = null;
      if (property.coordinatorUserId) {
        const [coordUser] = await db
          .select({
            id: schema.users.id,
            name: schema.users.name,
            phone: schema.users.phone,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(eq(schema.users.id, property.coordinatorUserId))
          .limit(1);
        coordinator = coordUser || null;
      }

      const [activeResidentsCountRes] = await db
        .select({ count: sql`count(*)` })
        .from(schema.residents)
        .where(
          and(
            eq(schema.residents.rentalPropertyId, property.id),
            eq(schema.residents.isActive, true)
          )
        );

      const activeResidentsCount = Number(activeResidentsCountRes?.count ?? 0);
      const vacantRooms = Math.max(0, property.totalRooms - activeResidentsCount);

      return {
        ...dwelling,
        property: {
          id: property.id,
          name: property.name,
          contactPerson: property.contactPerson,
          phone: property.phone,
          totalRooms: property.totalRooms,
          activeResidentsCount,
          vacantRooms,
          coordinator,
        },
      };
    }
  }

  return {
    ...dwelling,
  };
}

// ==========================================
// FAMILY WORKFLOW QUERIES (KK STATUS TRANSITIONS)
// ==========================================

/**
 * Mengambil KK milik session user (dicari via familyNumber atau headUserId).
 */
export async function getMyFamily(userId: string, familyNumber?: string | null) {
  let family = null;

  if (familyNumber) {
    const [res] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.familyNumber, familyNumber))
      .limit(1);
    family = res;
  }

  if (!family) {
    const [res] = await db
      .select()
      .from(schema.families)
      .where(eq(schema.families.headUserId, userId))
      .limit(1);
    family = res;
  }

  return family ?? null;
}

/**
 * Mengubah status KK ke 'pending' untuk dikirim ke RT untuk verifikasi.
 * Mengirim notifikasi ke semua user dengan roleId 2 (Ketua RT).
 */
export async function submitFamily(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (!family.kkFile) throw new Error('NO_KK_FILE');
  if (family.verificationStatus !== 'draft' && family.verificationStatus !== 'rejected') {
    throw new Error('INVALID_STATUS');
  }

  await db
    .update(schema.families)
    .set({ verificationStatus: 'pending', verificationNote: null, updatedAt: new Date() })
    .where(eq(schema.families.id, familyId));

  try {
    const rts = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.roleId, 2));
    if (rts.length > 0) {
      await Promise.all(
        rts.map((rt) =>
          db.insert(schema.notifications).values({
            userId: rt.id,
            title: 'Verifikasi KK Baru',
            message: `Warga bernama ${family.headName} mengirimkan pengajuan berkas Kartu Keluarga untuk diverifikasi.`,
            category: 'dinas',
            redirectLink: `/dashboard/approvals/documents/${familyId}`,
          })
        )
      );
    }
  } catch (notifErr) {
    console.error('Failed to create notifications for RTs:', notifErr);
  }
}

/**
 * Membatalkan pengajuan verifikasi KK (dari 'pending' kembali ke 'draft').
 * Juga menghapus notifikasi yang sudah dikirim ke RT.
 */
export async function cancelSubmitFamily(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (family.verificationStatus !== 'pending') throw new Error('INVALID_STATUS');

  await db
    .update(schema.families)
    .set({ verificationStatus: 'draft', verificationNote: null, updatedAt: new Date() })
    .where(eq(schema.families.id, familyId));

  try {
    await db
      .delete(schema.notifications)
      .where(
        and(
          eq(schema.notifications.redirectLink, `/dashboard/approvals/documents/${familyId}`),
          eq(schema.notifications.category, 'dinas')
        )
      );
  } catch (notifErr) {
    console.error('Failed to delete notifications on cancel-submit:', notifErr);
  }
}

/**
 * Mengajukan perubahan data KK (membuka kembali mode draft dari status 'verified').
 */
export async function requestFamilyChange(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');

  await db
    .update(schema.families)
    .set({ verificationStatus: 'draft', verificationNote: null, draftOpenedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.families.id, familyId));
}

/**
 * Membatalkan perubahan yang sudah dibuka (mengembalikan dari 'draft' ke 'verified').
 */
export async function cancelFamilyChange(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (family.verificationStatus !== 'draft') throw new Error('INVALID_STATUS');
  if (!family.hasVerified) throw new Error('NOT_YET_VERIFIED');

  const baseTime = family.draftOpenedAt ? new Date(family.draftOpenedAt).getTime() : new Date(family.updatedAt).getTime();

  const hasMemberChanges = (family.members || []).some((member) => {
    const memberUpdated = new Date(member.updatedAt).getTime();
    const memberCreated = new Date(member.createdAt).getTime();
    return memberUpdated > baseTime + 2000 || memberCreated > baseTime + 2000;
  });

  const hasFamilyChanges = new Date(family.updatedAt).getTime() > baseTime + 2000;

  if (hasMemberChanges || hasFamilyChanges) {
    throw new Error('HAS_CHANGES');
  }

  await db
    .update(schema.families)
    .set({ verificationStatus: 'verified', verificationNote: null, updatedAt: new Date() })
    .where(eq(schema.families.id, familyId));
}

// ==========================================
// DWELLING PUBLIC LIST & TYPE-CHANGE QUERIES
// ==========================================

/**
 * Mengambil daftar hunian aktif untuk dropdown public (tanpa auth).
 */
export async function listActiveDwellingsPublic() {
  const activeDwellings = await db
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
      and(
        eq(schema.dwellings.id, schema.rentalProperties.dwellingId),
        eq(schema.rentalProperties.isActive, true)
      )
    )
    .where(eq(schema.dwellings.isActive, true));

  return activeDwellings.map((d) => ({
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
 * Validasi perubahan tipe hunian dan lakukan efek samping yang diperlukan.
 * Melempar Error dengan kode string jika validasi gagal.
 */
export async function validateAndChangeDwellingType(
  dwellingId: number,
  currentType: string,
  newType: string
) {
  if (newType === currentType) return;

  if (currentType === 'permanen') {
    const activeFamilies = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.families)
      .where(and(eq(schema.families.dwellingId, dwellingId), eq(schema.families.isActive, true)))
      .then((res) => Number(res[0]?.count || 0));

    if (activeFamilies > 0) throw new Error('HAS_ACTIVE_FAMILIES');
  } else if (currentType === 'kos' || currentType === 'homestay') {
    const activeTenants = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.residents)
      .innerJoin(schema.rentalProperties, eq(schema.residents.rentalPropertyId, schema.rentalProperties.id))
      .where(and(eq(schema.rentalProperties.dwellingId, dwellingId), eq(schema.residents.isActive, true)))
      .then((res) => Number(res[0]?.count || 0));

    if (activeTenants > 0) throw new Error('HAS_ACTIVE_TENANTS');

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
 * Mengambil seluruh data hunian, KK, anggota, properti sewa, dan penyewa
 * untuk tampilan peta lingkungan. Data sensitif di-sensor jika bukan officer.
 */
export async function getNeighborhoodMap(isOfficer: boolean) {
  const allDwellings = await db.select().from(schema.dwellings).where(eq(schema.dwellings.isActive, true));
  const allFamilies = await db.select().from(schema.families).where(eq(schema.families.isActive, true));
  const allMembers = await db
    .select()
    .from(schema.residents)
    .where(and(eq(schema.residents.isActive, true), eq(schema.residents.residentType, 'warga_tetap')));
  const allRentalProperties = await db
    .select()
    .from(schema.rentalProperties)
    .where(eq(schema.rentalProperties.isActive, true));
  const allRentalResidents = await db
    .select()
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.isActive, true),
        eq(schema.residents.verificationStatus, 'verified'),
        or(
          eq(schema.residents.residentType, 'sewa_perorangan'),
          eq(schema.residents.residentType, 'sewa_keluarga')
        )
      )
    );

  return allDwellings.map((dwelling) => {
    const dwellingFamilies = allFamilies
      .filter((f) => f.dwellingId === dwelling.id)
      .map((family) => ({
        id: family.id,
        familyNumber: isOfficer
          ? family.familyNumber
          : `${family.familyNumber.slice(0, 4)}${'*'.repeat(family.familyNumber.length - 8)}${family.familyNumber.slice(-4)}`,
        headName: family.headName,
        unitNumber: family.unitNumber,
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
        residents: allRentalResidents
          .filter((rr) => rr.rentalPropertyId === property.id)
          .map((resident) => ({
            id: resident.id,
            name: resident.name,
            nik: isOfficer ? resident.nik : _censorNik(resident.nik),
            phone: isOfficer ? resident.phone : _censorPhone(resident.phone),
            originAddress: resident.originAddress,
            occupation: resident.occupation,
            educationLevel: resident.educationLevel,
            roomNumber: resident.roomNumber,
            tenantType: resident.residentType === 'sewa_keluarga' ? 'keluarga' : 'perorangan',
            checkInDate: resident.checkInDate,
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

/**
 * Mengambil informasi pemilik dari sebuah dwelling.
 */
export async function getDwellingOwner(dwellingId: number) {
  const [dwelling] = await db
    .select({ ownerUserId: schema.dwellings.ownerUserId })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.id, dwellingId))
    .limit(1);

  return dwelling ?? null;
}

/**
 * Mengklaim kepemilikan sebuah dwelling.
 */
export async function claimDwellingOwner(
  dwellingId: number,
  ownerUserId: string,
  ownerName: string,
  ownerPhone?: string | null
) {
  await db
    .update(schema.dwellings)
    .set({
      ownerUserId,
      ownerName,
      ownerPhone: ownerPhone || null,
    })
    .where(eq(schema.dwellings.id, dwellingId));
}

