import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, ne } from 'drizzle-orm';


import { encryptPII, decryptPII, hashPII, matchEncryptedPII } from '@/lib/crypto-pii';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateFamilyMemberInput {
  familyId: number;
  name: string;
  nik: string;
  gender: 'L' | 'P';
  birthPlace?: string | null;
  birthDate?: string | null;
  relationship: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Mertua' | 'Sepupu' | 'Lainnya';
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu' | 'Lainnya' | null;
  phone?: string | null;
  isKtpSameVillage?: boolean;
  ktpAddress?: string | null;
  ktpFile?: string | null;
  userId?: string | null;
}

export interface UpdateFamilyMemberInput {
  name?: string;
  nik?: string;
  gender?: 'L' | 'P';
  birthPlace?: string | null;
  birthDate?: string | null;
  relationship?: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Mertua' | 'Sepupu' | 'Lainnya';
  occupation?: string | null;
  educationLevel?: string | null;
  religion?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu' | 'Lainnya' | null;
  phone?: string | null;
  isKtpSameVillage?: boolean;
  ktpAddress?: string | null;
  ktpFile?: string | null;
  isActive?: boolean;
  inactiveNote?: string | null;
}

export interface ListFamilyMembersOptions {
  familyId?: number;
  isActive?: boolean;
  gender?: 'L' | 'P';
  relationship?: string;
  query?: string;
  limit?: number;
  offset?: number;
}


// ==========================================
// READ QUERIES
// ==========================================

/**
 * Ambil anggota keluarga berdasarkan ID.
 */
export async function getFamilyMemberById(id: number) {
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.id, id))
    .limit(1);
  return member ?? null;
}

/**
 * Ambil anggota keluarga berdasarkan NIK (exact match via blind index).
 */
export async function getFamilyMemberByNik(nik: string) {
  const nikHash = hashPII(nik);
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.nikHash, nikHash))
    .limit(1);
  if (!member) return null;
  return { ...member, nik: decryptPII(member.nik) };
}

/**
 * Ambil anggota keluarga berdasarkan userId.
 */
export async function getFamilyMemberByUserId(userId: string) {
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.userId, userId))
    .limit(1);
  return member ?? null;
}

/**
 * Ambil semua anggota dari satu KK.
 */
export async function getFamilyMembersByFamilyId(familyId: number) {
  return db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.familyId, familyId))
    .orderBy(schema.familyMembers.relationship);
}

/**
 * Daftar anggota keluarga terpaginasi dengan filter.
 */
export async function listFamilyMembers(options: ListFamilyMembersOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) conditions.push(eq(schema.familyMembers.isActive, options.isActive));
  if (options.gender !== undefined) conditions.push(eq(schema.familyMembers.gender, options.gender));
  if (options.familyId !== undefined) conditions.push(eq(schema.familyMembers.familyId, options.familyId));
  if (options.relationship !== undefined) conditions.push(eq(schema.familyMembers.relationship, options.relationship as any));

  let isPartialNumeric = false;
  let trimmed = '';

  if (options.query) {
    trimmed = options.query.trim();
    const queryHash = hashPII(trimmed);
    const isNumeric = /^[0-9]+$/.test(trimmed);
    const isExact16 = isNumeric && trimmed.length === 16;

    if (isExact16) {
      conditions.push(
        or(
          eq(schema.familyMembers.nikHash, queryHash),
          eq(schema.families.familyNumberHash, queryHash)
        )
      );
    } else if (!isNumeric) {
      conditions.push(like(schema.familyMembers.name, `%${trimmed}%`));
    } else {
      isPartialNumeric = true;
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawData = await db
    .select({
      id: schema.familyMembers.id,
      familyId: schema.familyMembers.familyId,
      userId: schema.familyMembers.userId,
      name: schema.familyMembers.name,
      nik: schema.familyMembers.nik,
      gender: schema.familyMembers.gender,
      birthPlace: schema.familyMembers.birthPlace,
      birthDate: schema.familyMembers.birthDate,
      phone: schema.familyMembers.phone,
      relationship: schema.familyMembers.relationship,
      occupation: schema.familyMembers.occupation,
      educationLevel: schema.familyMembers.educationLevel,
      religion: schema.familyMembers.religion,
      ktpFile: schema.familyMembers.ktpFile,
      inactiveNote: schema.familyMembers.inactiveNote,
      isActive: schema.familyMembers.isActive,
      createdAt: schema.familyMembers.createdAt,
      familyNumber: schema.families.familyNumber,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.familyMembers)
    .leftJoin(schema.families, eq(schema.familyMembers.familyId, schema.families.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(whereClause)
    .limit(isPartialNumeric ? 1000 : limit)
    .offset(isPartialNumeric ? 0 : offset)
    .orderBy(desc(schema.familyMembers.createdAt));

  const matchedRows = isPartialNumeric
    ? rawData.filter(
        (m) => matchEncryptedPII(m.nik, trimmed) || matchEncryptedPII(m.familyNumber, trimmed)
      )
    : rawData;

  const totalCount = isPartialNumeric
    ? matchedRows.length
    : await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.familyMembers)
        .leftJoin(schema.families, eq(schema.familyMembers.familyId, schema.families.id))
        .where(whereClause)
        .then((res) => Number(res[0]?.count ?? 0));

  const pageItems = isPartialNumeric ? matchedRows.slice(offset, offset + limit) : matchedRows;

  return {
    data: pageItems.map((m) => ({ ...m, nik: decryptPII(m.nik) })),
    metadata: { total: totalCount, limit, offset },
  };
}

/**
 * Daftar Kepala Keluarga yang belum memiliki akun.
 * Berguna untuk form Tambah Akun di Menu Warga.
 */
export async function listFamilyMembersWithoutAccount() {
  const rows = await db
    .select({
      id: schema.familyMembers.id,
      name: schema.familyMembers.name,
      nik: schema.familyMembers.nik,
    })
    .from(schema.familyMembers)
    .where(
      and(
        eq(schema.familyMembers.relationship, 'Kepala_Keluarga'),
        sql`${schema.familyMembers.userId} IS NULL`,
        eq(schema.familyMembers.isActive, true)
      )
    )
    .orderBy(schema.familyMembers.name);
  return rows.map(r => ({ ...r, nik: decryptPII(r.nik) }));
}

// ==========================================
// WRITE QUERIES
// ==========================================

/**
 * Tambahkan anggota keluarga baru.
 * Cek duplikasi NIK terlebih dahulu.
 * Auto-connect ke user account jika NIK terdaftar.
 */
export async function createFamilyMember(data: CreateFamilyMemberInput) {
  // Cek duplikasi NIK via blind index
  const nikHash = hashPII(data.nik);
  const [existing] = await db
    .select({ id: schema.familyMembers.id, familyId: schema.familyMembers.familyId, isActive: schema.familyMembers.isActive })
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.nikHash, nikHash))
    .limit(1);
  if (existing) {
    if (existing.familyId === data.familyId && !existing.isActive) {
      throw new Error(`NIK ${data.nik} sudah terdaftar sebagai anggota non-aktif di KK ini. Silakan gunakan tombol "Aktifkan" pada tabel anggota keluarga.`);
    }
    throw new Error(`NIK ${data.nik} sudah terdaftar di sistem kependudukan.`);
  }

  // Jika hubungan = Kepala_Keluarga, pastikan KK belum punya Kepala Keluarga aktif
  if (data.relationship === 'Kepala_Keluarga') {
    const [existingHead] = await db
      .select({ id: schema.familyMembers.id })
      .from(schema.familyMembers)
      .where(
        and(
          eq(schema.familyMembers.familyId, data.familyId),
          eq(schema.familyMembers.relationship, 'Kepala_Keluarga'),
          eq(schema.familyMembers.isActive, true)
        )
      )
      .limit(1);

    if (existingHead) {
      throw new Error('Kartu Keluarga ini sudah memiliki Kepala Keluarga aktif. Gunakan fitur Ganti Kepala Keluarga.');
    }
  }

  // Auto-connect: cek apakah NIK ini punya user account
  let linkedUserId: string | null = data.userId ?? null;
  if (!linkedUserId) {
    const [existingMemberWithUser] = await db
      .select({ userId: schema.familyMembers.userId })
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.nikHash, nikHash), ne(schema.familyMembers.isActive, false)))
      .limit(1);
    linkedUserId = existingMemberWithUser?.userId ?? null;
  }

  const nikEncrypted = encryptPII(data.nik);
  const [insertResult] = await db.insert(schema.familyMembers).values({
    familyId: data.familyId,
    userId: linkedUserId,
    name: data.name,
    nik: nikEncrypted,
    nikHash,
    gender: data.gender,
    birthPlace: data.birthPlace ?? null,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    phone: data.phone ?? null,
    relationship: data.relationship,
    occupation: data.occupation ?? null,
    educationLevel: data.educationLevel ?? null,
    religion: data.religion ?? null,
    isKtpSameVillage: data.isKtpSameVillage ?? true,
    ktpAddress: data.ktpAddress ?? null,
    ktpFile: data.ktpFile ?? null,
    isActive: true,
  });

  return insertResult.insertId;
}

/**
 * Perbarui data anggota keluarga.
 */
export async function updateFamilyMember(id: number, data: UpdateFamilyMemberInput) {
  // Jika hubungan diubah menjadi Kepala_Keluarga, pastikan KK belum memiliki Kepala Keluarga aktif lain
  if (data.relationship === 'Kepala_Keluarga') {
    const [targetMember] = await db
      .select({ familyId: schema.familyMembers.familyId, relationship: schema.familyMembers.relationship })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, id))
      .limit(1);

    if (targetMember && targetMember.relationship !== 'Kepala_Keluarga') {
      const [existingHead] = await db
        .select({ id: schema.familyMembers.id })
        .from(schema.familyMembers)
        .where(
          and(
            eq(schema.familyMembers.familyId, targetMember.familyId),
            eq(schema.familyMembers.relationship, 'Kepala_Keluarga'),
            eq(schema.familyMembers.isActive, true),
            ne(schema.familyMembers.id, id)
          )
        )
        .limit(1);

      if (existingHead) {
        throw new Error('Kartu Keluarga ini sudah memiliki Kepala Keluarga aktif. Gunakan fitur Ganti Kepala Keluarga.');
      }
    }
  }

  const updateData: any = { ...data, updatedAt: new Date() };
  if (typeof data.birthDate === 'string') {
    updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
  }
  // Enkripsi NIK jika ada perubahan NIK
  if (data.nik) {
    updateData.nik = encryptPII(data.nik);
    updateData.nikHash = hashPII(data.nik);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.familyMembers)
      .set(updateData)
      .where(eq(schema.familyMembers.id, id));

    // Jika member terhubung ke akun user (misal Kepala Keluarga), sinkronkan nama dan phone ke tabel users
    const [member] = await tx
      .select({ userId: schema.familyMembers.userId })
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, id))
      .limit(1);

    if (member?.userId) {
      const userUpdate: any = { updatedAt: new Date() };
      if (data.name) userUpdate.name = data.name;
      if (data.phone !== undefined) userUpdate.phone = data.phone;

      await tx
        .update(schema.users)
        .set(userUpdate)
        .where(eq(schema.users.id, member.userId));
    }
  });

  return true;
}

/**
 * Soft-delete anggota keluarga.
 */
export async function deleteFamilyMember(id: number, note?: string) {
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.id, id))
    .limit(1);

  if (!member) throw new Error('Anggota keluarga tidak ditemukan.');

  if (member.relationship === 'Kepala_Keluarga') {
    throw new Error('Kepala Keluarga tidak dapat dihapus. Lakukan Ganti Kepala Keluarga terlebih dahulu atau nonaktifkan Kartu Keluarga melalui Pengurus RT.');
  }

  await db
    .update(schema.familyMembers)
    .set({ isActive: false, inactiveNote: note ?? null, updatedAt: new Date() })
    .where(eq(schema.familyMembers.id, id));
  return true;
}

/**
 * Pindahkan anggota keluarga ke KK lain.
 */
export async function transferFamilyMember(data: {
  memberId: number;
  relationship: 'Kepala_Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Orang_Tua' | 'Mertua' | 'Sepupu' | 'Lainnya';
  targetFamilyId: number;
}) {
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.id, data.memberId))
    .limit(1);

  if (!member) throw new Error(`Anggota keluarga ID ${data.memberId} tidak ditemukan.`);

  await db
    .update(schema.familyMembers)
    .set({
      familyId: data.targetFamilyId,
      relationship: data.relationship,
      updatedAt: new Date(),
    })
    .where(eq(schema.familyMembers.id, data.memberId));

  // Jika dipindahkan menjadi Kepala Keluarga, update families.headUserId
  if (data.relationship === 'Kepala_Keluarga' && member.userId) {
    await db
      .update(schema.families)
      .set({ headUserId: member.userId, updatedAt: new Date() })
      .where(eq(schema.families.id, data.targetFamilyId));
  }

  return data.targetFamilyId;
}

/**
 * Ubah kepala keluarga KK.
 */
export async function changeFamilyHead(data: {
  familyId: number;
  newHeadMemberId: number;
}) {
  return await db.transaction(async (tx) => {
    const [family] = await tx
      .select()
      .from(schema.families)
      .where(eq(schema.families.id, data.familyId))
      .limit(1);

    if (!family) throw new Error(`KK ID ${data.familyId} tidak ditemukan.`);

    const [newHeadMember] = await tx
      .select()
      .from(schema.familyMembers)
      .where(eq(schema.familyMembers.id, data.newHeadMemberId))
      .limit(1);

    if (!newHeadMember) throw new Error(`Anggota ID ${data.newHeadMemberId} tidak ditemukan.`);
    if (newHeadMember.familyId !== data.familyId) throw new Error('Anggota tidak berada dalam KK ini.');
    if (!newHeadMember.isActive) throw new Error('Anggota yang dipilih sudah tidak aktif dan tidak dapat dijadikan Kepala Keluarga.');

    // Proses kepala lama
    const [oldHeadMember] = await tx
      .select()
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.familyId, data.familyId), eq(schema.familyMembers.relationship, 'Kepala_Keluarga')))
      .limit(1);

    // 1. Proses kepala lama: turunkan status menjadi 'Lainnya' dan cabut Role 6 (Warga)
    if (oldHeadMember) {
      await tx
        .update(schema.familyMembers)
        .set({ relationship: 'Lainnya', updatedAt: new Date() })
        .where(eq(schema.familyMembers.id, oldHeadMember.id));

      if (oldHeadMember.userId) {
        // Cabut Role 6 dari kepala keluarga lama
        await tx
          .delete(schema.userRoles)
          .where(
            and(
              eq(schema.userRoles.userId, oldHeadMember.userId),
              eq(schema.userRoles.roleId, 6)
            )
          );

        // Jika user lama masih memiliki role lain (misal Koordinator Kos / Pengurus RT), pastikan salah satunya menjadi primary
        const remainingRoles = await tx
          .select({ id: schema.userRoles.id, isPrimary: schema.userRoles.isPrimary })
          .from(schema.userRoles)
          .where(eq(schema.userRoles.userId, oldHeadMember.userId));

        if (remainingRoles.length > 0 && !remainingRoles.some((r) => r.isPrimary)) {
          await tx
            .update(schema.userRoles)
            .set({ isPrimary: true })
            .where(eq(schema.userRoles.id, remainingRoles[0].id));
        }
      }
    }

    // 2. Set kepala baru & berikan Role 6 (Warga)
    await tx
      .update(schema.familyMembers)
      .set({ relationship: 'Kepala_Keluarga', updatedAt: new Date() })
      .where(eq(schema.familyMembers.id, data.newHeadMemberId));

    if (newHeadMember.userId) {
      const existingUserRoles = await tx
        .select({ id: schema.userRoles.id, isPrimary: schema.userRoles.isPrimary })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, newHeadMember.userId));

      const hasPrimaryRole = existingUserRoles.some((r) => r.isPrimary);
      await tx
        .insert(schema.userRoles)
        .values({
          userId: newHeadMember.userId,
          roleId: 6,
          isPrimary: !hasPrimaryRole,
        })
        .onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // 3. Alihkan kepemilikan aset hunian / properti sewa keluarga ke Kepala Keluarga baru
    if (family.dwellingId) {
      const [dwelling] = await tx
        .select({ id: schema.dwellings.id, ownerUserId: schema.dwellings.ownerUserId })
        .from(schema.dwellings)
        .where(eq(schema.dwellings.id, family.dwellingId))
        .limit(1);

      if (dwelling && oldHeadMember?.userId && dwelling.ownerUserId === oldHeadMember.userId) {
        await tx
          .update(schema.dwellings)
          .set({
            ownerUserId: newHeadMember.userId ?? null,
          })
          .where(eq(schema.dwellings.id, dwelling.id));

        // Jika properti sewa pada hunian ini dikoordinatori oleh kepala lama, alihkan juga ke kepala baru
        await tx
          .update(schema.rentalProperties)
          .set({
            coordinatorUserId: newHeadMember.userId ?? null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.rentalProperties.dwellingId, dwelling.id),
              eq(schema.rentalProperties.coordinatorUserId, oldHeadMember.userId)
            )
          );
      }
    }
    
    // 4. Perbarui kepemilikan KK: Pastikan ownership jatuh ke user baru
    await tx
      .update(schema.families)
      .set({
        headUserId: newHeadMember.userId ?? null,
        verificationStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, data.familyId));

    return true;
  });
}


