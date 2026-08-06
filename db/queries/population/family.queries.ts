import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { notifyRoles, notifyUser } from '@/lib/notifications';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CreateFamilyInput {
  dwellingId: number;
  familyNumber: string;
  headUserId?: string | null;
  kkFile?: string | null;
  verificationStatus?: 'draft' | 'pending' | 'verified' | 'rejected' | 'changes_pending';
  verificationNote?: string | null;
}

export interface UpdateFamilyInput {
  dwellingId?: number;
  familyNumber?: string;
  headUserId?: string | null;
  kkFile?: string | null;
  verificationStatus?: 'draft' | 'pending' | 'verified' | 'rejected' | 'changes_pending';
  verificationNote?: string | null;
  isActive?: boolean;
}

export interface ListFamiliesOptions {
  limit?: number;
  offset?: number;
  query?: string;
  dwellingId?: number;
  verificationStatus?: 'draft' | 'pending' | 'verified' | 'rejected' | 'changes_pending';
  isActive?: boolean;
}

// ==========================================
// READ QUERIES
// ==========================================

/**
 * Daftar Kartu Keluarga terpaginasi dengan pencarian & filter.
 */
export async function listFamilies(options: ListFamiliesOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];
  if (options.isActive !== undefined) conditions.push(eq(schema.families.isActive, options.isActive));
  if (options.dwellingId) conditions.push(eq(schema.families.dwellingId, options.dwellingId));
  if (options.verificationStatus) conditions.push(eq(schema.families.verificationStatus, options.verificationStatus));
  if (options.query) {
    const v = `%${options.query}%`;
    conditions.push(or(like(schema.families.familyNumber, v), like(schema.users.name, v)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Subquery jumlah anggota keluarga aktif
  const memberCountSubquery = db
    .select({
      familyId: schema.familyMembers.familyId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.isActive, true))
    .groupBy(schema.familyMembers.familyId)
    .as('member_count');

  const data = await db
    .select({
      id: schema.families.id,
      familyNumber: schema.families.familyNumber,
      headUserId: schema.families.headUserId,
      headName: schema.users.name,
      dwellingId: schema.families.dwellingId,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
      verificationStatus: schema.families.verificationStatus,
      verificationNote: schema.families.verificationNote,
      kkFile: schema.families.kkFile,
      isActive: schema.families.isActive,
      createdAt: schema.families.createdAt,
      checkInDate: schema.families.createdAt,
      updatedAt: schema.families.updatedAt,
      memberCount: sql<number>`COALESCE(${memberCountSubquery.count}, 0)`.mapWith(Number),
    })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .leftJoin(memberCountSubquery, eq(schema.families.id, memberCountSubquery.familyId))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.families.createdAt));

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(whereClause);

  return {
    data,
    metadata: { total: Number(totalResult?.count ?? 0), limit, offset },
  };
}

/**
 * Detail satu Kartu Keluarga berdasarkan ID.
 */
export async function getFamilyById(id: number) {
  const [family] = await db
    .select({
      id: schema.families.id,
      familyNumber: schema.families.familyNumber,
      headUserId: schema.families.headUserId,
      headName: schema.users.name,
      dwellingId: schema.families.dwellingId,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      dwellingType: schema.dwellings.type,
      verificationStatus: schema.families.verificationStatus,
      verificationNote: schema.families.verificationNote,
      draftOpenedAt: schema.families.draftOpenedAt,
      kkFile: schema.families.kkFile,
      isActive: schema.families.isActive,
      createdAt: schema.families.createdAt,
      updatedAt: schema.families.updatedAt,
    })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
    .where(eq(schema.families.id, id))
    .limit(1);

  if (!family) return null;

  let dwellingId = family.dwellingId;
  let blockNumber = family.blockNumber;
  let houseNumber = family.houseNumber;
  let dwellingType = family.dwellingType;

  // Fallback: Jika dwellingId NULL, cari hunian tempat headUserId terdaftar sebagai pemilik
  if (!dwellingId && family.headUserId) {
    const [fallbackDwelling] = await db
      .select({
        id: schema.dwellings.id,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        type: schema.dwellings.type,
      })
      .from(schema.dwellings)
      .where(and(eq(schema.dwellings.ownerUserId, family.headUserId), eq(schema.dwellings.isActive, true)))
      .limit(1);

    if (fallbackDwelling) {
      dwellingId = fallbackDwelling.id;
      blockNumber = fallbackDwelling.blockNumber;
      houseNumber = fallbackDwelling.houseNumber;
      dwellingType = fallbackDwelling.type;

      // Auto-link ke database agar permanen
      await db.update(schema.families).set({ dwellingId: fallbackDwelling.id }).where(eq(schema.families.id, id));
    }
  }

  const members = await db
    .select({
      id: schema.familyMembers.id,
      familyId: schema.familyMembers.familyId,
      nik: schema.familyMembers.nik,
      name: schema.familyMembers.name,
      gender: schema.familyMembers.gender,
      relationship: schema.familyMembers.relationship,
      birthPlace: schema.familyMembers.birthPlace,
      birthDate: schema.familyMembers.birthDate,
      phone: schema.familyMembers.phone,
      occupation: schema.familyMembers.occupation,
      educationLevel: schema.familyMembers.educationLevel,
      ktpFile: schema.familyMembers.ktpFile,
      isActive: schema.familyMembers.isActive,
    })
    .from(schema.familyMembers)
    .where(eq(schema.familyMembers.familyId, id))
    .orderBy(schema.familyMembers.id);

  const checkInDateStr = family.createdAt ? (family.createdAt instanceof Date ? family.createdAt.toISOString() : String(family.createdAt)) : null;

  const dwelling = (dwellingId && blockNumber && houseNumber) ? {
    id: dwellingId,
    blockNumber,
    houseNumber,
    type: dwellingType || "permanen",
  } : null;

  return {
    ...family,
    dwellingId,
    blockNumber,
    houseNumber,
    dwelling,
    checkInDate: checkInDateStr,
    members,
  };
}

/**
 * Cari KK milik user tertentu (berdasarkan headUserId).
 */
export async function getMyFamily(userId: string) {
  const [family] = await db
    .select({
      id: schema.families.id,
      dwellingId: schema.families.dwellingId,
      headUserId: schema.families.headUserId,
      headName: schema.users.name,
      familyNumber: schema.families.familyNumber,
      kkFile: schema.families.kkFile,
      verificationStatus: schema.families.verificationStatus,
      verificationNote: schema.families.verificationNote,
      isActive: schema.families.isActive,
      createdAt: schema.families.createdAt,
      updatedAt: schema.families.updatedAt,
    })
    .from(schema.families)
    .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
    .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
    .limit(1);

  return family ?? null;
}

// ==========================================
// WRITE QUERIES
// ==========================================

/**
 * Buat Kartu Keluarga baru.
 */
export async function createFamily(data: CreateFamilyInput) {
  const [existing] = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(eq(schema.families.familyNumber, data.familyNumber))
    .limit(1);

  if (existing) throw new Error(`FAMILY_NUMBER_EXISTS:${data.familyNumber}`);

  if (data.headUserId) {
    const [isAdmin] = await db
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, data.headUserId), eq(schema.userRoles.roleId, 1)))
      .limit(1);

    if (isAdmin) {
      throw new Error('FORBIDDEN_ADMIN_KK:Akun Super Admin bersifat khusus sistem dan tidak dapat dijadikan Kepala Keluarga. Gunakan akun Warga terpisah.');
    }
  }

  return await db.transaction(async (tx) => {
    const [result] = await tx.insert(schema.families).values({
      dwellingId: data.dwellingId,
      familyNumber: data.familyNumber,
      headUserId: data.headUserId ?? null,
      kkFile: data.kkFile ?? null,
      verificationStatus: data.verificationStatus ?? 'draft',
      verificationNote: data.verificationNote ?? null,
      isActive: true,
    });

    if (data.headUserId) {
      await tx.insert(schema.userRoles).values({
        userId: data.headUserId,
        roleId: 6,
        isPrimary: false,
      }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    return result.insertId;
  });
}

/**
 * Buat KK sekaligus menambahkan Kepala Keluarga sebagai anggota pertama.
 */
export async function createFamilyWithHeadMember(input: {
  dwellingId: number;
  familyNumber: string;
  headUserId?: string | null;
  kkFile?: string | null;
  headNik: string;
  headName: string;
  headPhone?: string | null;
  headGender: 'L' | 'P';
  headBirthPlace?: string | null;
  headBirthDate?: Date | null;
  headOccupation?: string | null;
  headEducationLevel?: string | null;
  headKtpFile?: string | null;
}) {
  return await db.transaction(async (tx) => {
    const [insertFamily] = await tx.insert(schema.families).values({
      dwellingId: input.dwellingId,
      familyNumber: input.familyNumber,
      headUserId: input.headUserId ?? null,
      kkFile: input.kkFile ?? null,
      verificationStatus: 'draft',
      isActive: true,
    });

    const familyId = insertFamily.insertId;

    await tx.insert(schema.familyMembers).values({
      familyId,
      nik: input.headNik,
      name: input.headName,
      phone: input.headPhone ?? null,
      gender: input.headGender,
      relationship: 'Kepala_Keluarga',
      birthPlace: input.headBirthPlace ?? null,
      birthDate: input.headBirthDate ?? null,
      occupation: input.headOccupation ?? null,
      educationLevel: input.headEducationLevel ?? null,
      ktpFile: input.headKtpFile ?? null,
      isActive: true,
    });

    return familyId;
  });
}

/**
 * Perbarui data KK.
 */
export async function updateFamily(id: number, data: UpdateFamilyInput) {
  await db
    .update(schema.families)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.families.id, id));
  return true;
}

/**
 * Soft-delete KK — nonaktifkan KK dan semua anggota keluarga di dalamnya.
 */
export async function deleteFamily(id: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(schema.families)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.families.id, id));

    await tx
      .update(schema.familyMembers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.familyMembers.familyId, id));
  });
  return true;
}

// ==========================================
// WORKFLOW QUERIES (STATUS TRANSITIONS)
// ==========================================

export async function submitFamily(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (!family.kkFile) throw new Error('NO_KK_FILE');
  if (family.verificationStatus !== 'draft' && family.verificationStatus !== 'rejected' && family.verificationStatus !== 'changes_pending') {
    throw new Error('INVALID_STATUS');
  }

  await db
    .update(schema.families)
    .set({ verificationStatus: 'pending', verificationNote: null, updatedAt: new Date() })
    .where(eq(schema.families.id, familyId));

  try {
    await notifyRoles(['ketua-rt'], {
      title: 'Verifikasi KK Baru',
      message: `Warga bernama ${family.headName} mengirimkan pengajuan Kartu Keluarga untuk diverifikasi.`,
      category: 'dinas',
      redirectLink: `/dashboard/approvals/documents/${familyId}`,
    });
  } catch (err) {
    console.error('Gagal kirim notifikasi submitFamily:', err);
  }
}

export async function verifyFamilyStatus(familyId: number, action: 'approve' | 'reject', note?: string | null) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');

  const newStatus = action === 'approve' ? 'verified' : 'rejected';
  const verificationNote = action === 'reject' ? note || 'Ditolak oleh RT' : null;

  await db.transaction(async (tx) => {
    await tx
      .update(schema.families)
      .set({
        verificationStatus: newStatus,
        verificationNote,
        draftOpenedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.families.id, familyId));

    if (family.headUserId) {
      const statusText = action === 'approve' ? 'disetujui' : 'ditolak';
      await notifyUser(family.headUserId, {
        title: `Kartu Keluarga ${action === 'approve' ? 'Disetujui' : 'Ditolak'}`,
        message: note
          ? `Kartu Keluarga Anda ${statusText}. Catatan: ${note}`
          : `Kartu Keluarga Anda telah ${statusText} oleh RT.`,
        category: 'dinas',
        redirectLink: '/dashboard/my-family',
      });
    }
  });
}

export async function cancelFamilyChange(familyId: number, userId: string) {
  const [family] = await db.select().from(schema.families).where(eq(schema.families.id, familyId)).limit(1);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (family.verificationStatus !== 'draft' && family.verificationStatus !== 'changes_pending') throw new Error('INVALID_STATUS');

  await db.update(schema.families).set({ verificationStatus: 'verified', verificationNote: null, draftOpenedAt: null, updatedAt: new Date() }).where(eq(schema.families.id, familyId));
  return true;
}

export async function cancelSubmitFamily(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (family.verificationStatus !== 'pending') throw new Error('INVALID_STATUS');

  // Jika KK memiliki penanda draftOpenedAt, berarti ini adalah pembatalan dari permohonan perubahan data (kembalikan ke 'changes_pending')
  // Jika tidak ada draftOpenedAt, berarti ini adalah registrasi awal baru (kembalikan ke 'draft')
  const nextStatus = family.draftOpenedAt ? 'changes_pending' : 'draft';
  await db.update(schema.families).set({ verificationStatus: nextStatus, updatedAt: new Date() }).where(eq(schema.families.id, familyId));
  return true;
}

export async function requestFamilyChange(familyId: number, userId: string) {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error('NOT_FOUND');
  if (family.headUserId !== userId) throw new Error('FORBIDDEN');
  if (family.verificationStatus !== 'verified') throw new Error('INVALID_STATUS');

  await db.update(schema.families).set({ verificationStatus: 'changes_pending', draftOpenedAt: new Date(), updatedAt: new Date() }).where(eq(schema.families.id, familyId));
  return true;
}

export async function setupMyFamilyCard(userId: string, input: {
  dwellingId: number;
  familyNumber: string;
  nik?: string | null;
  kkFile?: string | null;
}) {
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const [isAdmin] = await tx
      .select({ id: schema.userRoles.id })
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, 1)))
      .limit(1);

    if (isAdmin) throw new Error('Akun Super Admin bersifat khusus sistem dan tidak dapat mendaftarkan Kartu Keluarga. Gunakan akun Warga terpisah.');

    const [existingFamily] = await tx
      .select({ id: schema.families.id })
      .from(schema.families)
      .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
      .limit(1);

    if (existingFamily) throw new Error('Akun Anda sudah memiliki Kartu Keluarga yang terdaftar.');

    const cleanFamilyNo = input.familyNumber.trim();
    const [existingFamilyNo] = await tx
      .select({ id: schema.families.id, headUserId: schema.families.headUserId })
      .from(schema.families)
      .where(and(eq(schema.families.familyNumber, cleanFamilyNo), eq(schema.families.isActive, true)))
      .limit(1);

    if (existingFamilyNo && existingFamilyNo.headUserId) {
      throw new Error('Nomor Kartu Keluarga (KK) ini sudah terdaftar dengan Kepala Keluarga lain.');
    }

    const cleanNik = input.nik && input.nik.trim() !== '' ? input.nik.trim() : `${Date.now()}`.slice(0, 16);

    if (input.nik && input.nik.trim() !== '') {
      const [existingNikMember] = await tx
        .select({ id: schema.familyMembers.id, userId: schema.familyMembers.userId, relationship: schema.familyMembers.relationship, isActive: schema.familyMembers.isActive })
        .from(schema.familyMembers)
        .where(eq(schema.familyMembers.nik, cleanNik))
        .limit(1);

      if (existingNikMember) {
        if (existingNikMember.userId && existingNikMember.userId !== userId) {
          throw new Error('NIK ini sudah terhubung dengan akun Kepala Keluarga lain.');
        }
        if (existingNikMember.relationship === 'Kepala_Keluarga' && existingNikMember.isActive) {
          throw new Error('NIK ini sudah terdaftar sebagai Kepala Keluarga di KK lain.');
        }
        if (!existingNikMember.userId) {
          await tx
            .update(schema.familyMembers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(schema.familyMembers.id, existingNikMember.id));
        }
      }
    }

    const [insertResult] = await tx.insert(schema.families).values({
      dwellingId: input.dwellingId,
      familyNumber: cleanFamilyNo,
      headUserId: userId,
      kkFile: input.kkFile ?? null,
      verificationStatus: 'draft',
      isActive: true,
    });

    const familyId = insertResult.insertId;

    await tx.insert(schema.familyMembers).values({
      familyId,
      userId,
      nik: cleanNik,
      name: user.name,
      gender: 'L',
      relationship: 'Kepala_Keluarga',
      phone: user.phone ?? null,
      isActive: true,
    });

    await tx.insert(schema.userRoles).values({
      userId,
      roleId: 6,
      isPrimary: false,
    }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    return familyId;
  });
}