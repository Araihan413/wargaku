import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql, ne } from 'drizzle-orm';

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
  ktpFile?: string | null;
  isActive?: boolean;
}

export interface ListFamilyMembersOptions {
  limit?: number;
  offset?: number;
  gender?: 'L' | 'P';
  relationship?: string;
  isActive?: boolean;
  familyId?: number;
  query?: string;
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
 * Ambil anggota keluarga berdasarkan NIK.
 */
export async function getFamilyMemberByNik(nik: string) {
  const [member] = await db
    .select()
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.nik, nik))
    .limit(1);
  return member ?? null;
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
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.familyMembers.createdAt));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.familyMembers)
    .where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
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
  // Cek duplikasi NIK
  const existing = await getFamilyMemberByNik(data.nik);
  if (existing) {
    throw new Error(`NIK ${data.nik} sudah terdaftar di sistem kependudukan.`);
  }

  // Auto-connect: cek apakah NIK ini punya user account
  let linkedUserId: string | null = data.userId ?? null;
  if (!linkedUserId) {
    // Cari NIK di family_members lain untuk ambil userId
    const [existingMemberWithUser] = await db
      .select({ userId: schema.familyMembers.userId })
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.nik, data.nik), ne(schema.familyMembers.isActive, false)))
      .limit(1);
    linkedUserId = existingMemberWithUser?.userId ?? null;
  }

  const [insertResult] = await db.insert(schema.familyMembers).values({
    familyId: data.familyId,
    userId: linkedUserId,
    name: data.name,
    nik: data.nik,
    gender: data.gender,
    birthPlace: data.birthPlace ?? null,
    birthDate: data.birthDate ? new Date(data.birthDate) : null,
    phone: data.phone ?? null,
    relationship: data.relationship,
    occupation: data.occupation ?? null,
    educationLevel: data.educationLevel ?? null,
    religion: data.religion ?? null,
    ktpFile: data.ktpFile ?? null,
    isActive: true,
  });

  return insertResult.insertId;
}

/**
 * Perbarui data anggota keluarga.
 */
export async function updateFamilyMember(id: number, data: UpdateFamilyMemberInput) {
  // Cek duplikasi NIK jika berubah
  if (data.nik) {
    const [existing] = await db
      .select({ id: schema.familyMembers.id })
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.nik, data.nik), ne(schema.familyMembers.id, id)))
      .limit(1);
    if (existing) throw new Error(`NIK ${data.nik} sudah terdaftar untuk anggota lain.`);
  }

  const updateData: any = { ...data, updatedAt: new Date() };
  if (typeof data.birthDate === 'string') {
    updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
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
export async function deleteFamilyMember(id: number) {
  await db
    .update(schema.familyMembers)
    .set({ isActive: false, updatedAt: new Date() })
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
  oldHeadAction: 'suspend' | 'pindah' | 'none';
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

    // Proses kepala lama
    const [oldHeadMember] = await tx
      .select()
      .from(schema.familyMembers)
      .where(and(eq(schema.familyMembers.familyId, data.familyId), eq(schema.familyMembers.relationship, 'Kepala_Keluarga')))
      .limit(1);

    if (data.oldHeadAction === 'suspend' && family.headUserId) {
      await tx
        .update(schema.users)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(eq(schema.users.id, family.headUserId));
      if (oldHeadMember) {
        await tx.update(schema.familyMembers).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.familyMembers.id, oldHeadMember.id));
      }
    } else if (data.oldHeadAction === 'pindah' && oldHeadMember) {
      await tx.update(schema.familyMembers).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.familyMembers.id, oldHeadMember.id));
    } else if (data.oldHeadAction === 'none' && oldHeadMember) {
      await tx.update(schema.familyMembers).set({ relationship: 'Lainnya', updatedAt: new Date() }).where(eq(schema.familyMembers.id, oldHeadMember.id));
    }

    // Set kepala baru
    await tx.update(schema.familyMembers).set({ relationship: 'Kepala_Keluarga', updatedAt: new Date() }).where(eq(schema.familyMembers.id, data.newHeadMemberId));
    await tx
      .update(schema.families)
      .set({
        headUserId: newHeadMember.userId ?? family.headUserId,
        verificationStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, data.familyId));

    return true;
  });
}
