import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
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

    // Subquery untuk menghitung jumlah anggota keluarga aktif per KK
    const memberCountSubquery = db
      .select({
        familyId: schema.familyMembers.familyId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.isActive, true))
      .groupBy(schema.familyMembers.familyId)
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
  relationship?: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Lainnya';
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
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, data.memberId))
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

    // 2. Jika dipindahkan, update familyId dan relationship di familyMembers
    await tx
      .update(schema.familyMembers)
      .set({
        familyId: finalFamilyId,
        relationship: data.relationship,
        updatedAt: new Date(),
      })
      .where(eq(schema.familyMembers.id, data.memberId));

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
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, data.newHeadMemberId))
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
      .from(schema.familyMembers)
      .where(
        and(
          eq(schema.familyMembers.familyId, data.familyId),
          eq(schema.familyMembers.relationship, 'Kepala_Keluarga')
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
          .update(schema.familyMembers)
          .set({
            isActive: false,
            inactiveReason: 'meninggal',
            updatedAt: new Date(),
          })
          .where(eq(schema.familyMembers.id, oldHeadMember.id));
      }
    } else if (data.oldHeadAction === 'pindah') {
      // Tandai tidak aktif (pindah) di KK ini, tapi jangan suspend akun users-nya agar dia bisa login di KK barunya nanti
      if (oldHeadMember) {
        await tx
          .update(schema.familyMembers)
          .set({
            isActive: false,
            inactiveReason: 'pindah',
            updatedAt: new Date(),
          })
          .where(eq(schema.familyMembers.id, oldHeadMember.id));
      }
    } else if (data.oldHeadAction === 'none') {
      // Hanya ganti hubungannya menjadi 'Lainnya' di KK ini (dia tetap tinggal di KK ini tapi bukan kepala lagi)
      if (oldHeadMember) {
        await tx
          .update(schema.familyMembers)
          .set({
            relationship: 'Lainnya',
            updatedAt: new Date(),
          })
          .where(eq(schema.familyMembers.id, oldHeadMember.id));
      }
    }

    // 5. Update data Kepala Keluarga Baru di KK (families) & familyMembers
    await tx
      .update(schema.familyMembers)
      .set({
        relationship: 'Kepala_Keluarga',
        updatedAt: new Date(),
      })
      .where(eq(schema.familyMembers.id, data.newHeadMemberId));

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
    .select()
    .from(schema.dwellings)
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

