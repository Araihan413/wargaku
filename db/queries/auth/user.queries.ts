import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, or, like, desc, ne, sql, inArray, notInArray, isNull } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { notifyRoles } from '@/lib/notifications';
import { z } from 'zod';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ListUsersOptions {
  limit?: number;
  offset?: number;
  roleId?: number;
  status?: 'pending' | 'active' | 'suspended';
  query?: string;
  withoutFamily?: boolean;
  excludeExceptId?: string; // Abaikan pengecualian untuk ID tertentu
  excludeRoleIds?: number[]; // Role ID yang ingin dikecualikan
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  photo?: string | null;
  roleId?: number;
  roles?: number[];
  status?: 'pending' | 'active' | 'suspended';
  nik?: string | null;
  familyNumber?: string | null;
  dwellingId?: number | null;
  rentalPropertyId?: number | null;
  unitNumber?: string | null;
  gender?: 'L' | 'P' | null;
}

export interface UpdateUserInput {
  name: string;
  email: string;
  phone?: string | null;
  roleId: number;
  status?: 'pending' | 'active' | 'suspended';
}

// ==========================================
// READ QUERIES
// ==========================================

/**
 * Ambil daftar user dengan filter dan paginasi.
 * Role lookup dilakukan via user_roles (bukan users.roleId).
 */
export async function listUsers(options: ListUsersOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions: any[] = [];

  // Filter berdasarkan role via user_roles
  if (options.roleId !== undefined) {
    const userRoleSubquery = await db
      .select({ userId: schema.userRoles.userId })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.roleId, options.roleId));
    const matchedUserIds = userRoleSubquery.map((ur) => ur.userId);
    if (matchedUserIds.length > 0) {
      conditions.push(inArray(schema.users.id, matchedUserIds));
    } else {
      conditions.push(sql`1 = 0`); // no match
    }
  }

  // Pengecualian berdasarkan role via user_roles
  if (options.excludeRoleIds && options.excludeRoleIds.length > 0) {
    const excludedUserRoleSubquery = await db
      .select({ userId: schema.userRoles.userId })
      .from(schema.userRoles)
      .where(inArray(schema.userRoles.roleId, options.excludeRoleIds));
    const excludedUserIds = excludedUserRoleSubquery.map((ur) => ur.userId);
    if (excludedUserIds.length > 0) {
      conditions.push(notInArray(schema.users.id, excludedUserIds));
    }
  }

  if (options.status !== undefined) {
    conditions.push(eq(schema.users.status, options.status));
  }

  if (options.query) {
    conditions.push(
      or(
        like(schema.users.name, `%${options.query}%`),
        like(schema.users.email, `%${options.query}%`)
      )
    );
  }

  if (options.withoutFamily) {
    const familiesList = await db
      .select({ headUserId: schema.families.headUserId })
      .from(schema.families);
    let headUserIds = familiesList.map((f) => f.headUserId).filter(Boolean) as string[];
    if (options.excludeExceptId) {
      headUserIds = headUserIds.filter((id) => id !== options.excludeExceptId);
    }

    // Filter out Super Admin (Role 1) accounts from KK head selection
    const adminUserRoles = await db
      .select({ userId: schema.userRoles.userId })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.roleId, 1));
    const adminUserIds = adminUserRoles.map((ur) => ur.userId);

    const excludedIds = Array.from(new Set([...headUserIds, ...adminUserIds]));
    if (excludedIds.length > 0) {
      conditions.push(notInArray(schema.users.id, excludedIds));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      photo: schema.users.photo,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.users.createdAt));

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(whereClause);

  const total = Number(totalResult[0]?.count ?? 0);

  // Enrich dengan roles
  const userIds = data.map((u) => u.id);
  const allUserRoles =
    userIds.length > 0
      ? await db
          .select({
            userId: schema.userRoles.userId,
            roleId: schema.userRoles.roleId,
            isPrimary: schema.userRoles.isPrimary,
            roleName: schema.roles.name,
            roleSlug: schema.roles.slug,
          })
          .from(schema.userRoles)
          .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
          .where(inArray(schema.userRoles.userId, userIds))
      : [];

  const rolesMap = new Map<string, typeof allUserRoles>();
  for (const ur of allUserRoles) {
    const list = rolesMap.get(ur.userId) || [];
    list.push(ur);
    rolesMap.set(ur.userId, list);
  }

  const enrichedData = data.map((u) => {
    const roles = rolesMap.get(u.id) || [];
    const primaryRole = roles.find((r) => r.isPrimary) || roles[0] || null;
    return {
      ...u,
      roleId: primaryRole?.roleId ?? 6,
      roleName: primaryRole?.roleName ?? 'Warga',
      roleSlug: primaryRole?.roleSlug ?? 'warga',
      roleIds: roles.map((r) => r.roleId),
    };
  });

  return {
    data: enrichedData,
    metadata: { total, limit, offset },
  };
}

/**
 * Ambil daftar semua roles.
 */
export async function listRoles() {
  return db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
    })
    .from(schema.roles)
    .orderBy(schema.roles.id);
}

/**
 * Ambil data ringkas user berdasarkan ID (termasuk status aktif/pending/suspended).
 */
export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      status: schema.users.status,
      phone: schema.users.phone,
      photo: schema.users.photo,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return user ?? null;
}

/**
 * Ambil profil lengkap user, termasuk role aktif dan keluarga terhubung.
 */
export async function getUserFullProfile(userId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      emailVerified: schema.users.emailVerified,
      image: schema.users.image,
      phone: schema.users.phone,
      photo: schema.users.photo,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) return null;

  // Ambil semua role
  const roles = await db
    .select({
      roleId: schema.userRoles.roleId,
      isPrimary: schema.userRoles.isPrimary,
      roleName: schema.roles.name,
      roleSlug: schema.roles.slug,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));

  const primaryRole = roles.find((r) => r.isPrimary) || roles[0] || null;

  // 1. Cari data anggota keluarga (memberInfo) via userId
  let [memberInfo] = await db
    .select({
      id: schema.familyMembers.id,
      familyId: schema.familyMembers.familyId,
      relationship: schema.familyMembers.relationship,
      nik: schema.familyMembers.nik,
      name: schema.familyMembers.name,
      phone: schema.familyMembers.phone,
    })
    .from(schema.familyMembers)
    .where(and(eq(schema.familyMembers.userId, userId), eq(schema.familyMembers.isActive, true)))
    .limit(1);


  // 2. Cari data keluarga & hunian
  let familyData: any = null;

  if (memberInfo?.familyId) {
    // Cari KK berdasarkan familyId milik member
    const [fam] = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        verificationStatus: schema.families.verificationStatus,
        headUserId: schema.families.headUserId,
        headName: schema.users.name,
        dwellingId: schema.families.dwellingId,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        dwellingType: schema.dwellings.type,
      })
      .from(schema.families)
      .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
      .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
      .where(and(eq(schema.families.id, memberInfo.familyId), eq(schema.families.isActive, true)))
      .limit(1);
    familyData = fam;
  }

  if (!familyData) {
    // Fallback: cari KK di mana user ini adalah kepala keluarga (headUserId)
    const [fam] = await db
      .select({
        id: schema.families.id,
        familyNumber: schema.families.familyNumber,
        verificationStatus: schema.families.verificationStatus,
        headUserId: schema.families.headUserId,
        headName: schema.users.name,
        dwellingId: schema.families.dwellingId,
        blockNumber: schema.dwellings.blockNumber,
        houseNumber: schema.dwellings.houseNumber,
        dwellingType: schema.dwellings.type,
      })
      .from(schema.families)
      .leftJoin(schema.users, eq(schema.families.headUserId, schema.users.id))
      .leftJoin(schema.dwellings, eq(schema.families.dwellingId, schema.dwellings.id))
      .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
      .limit(1);

    if (fam) {
      familyData = fam;
      // Jika memberInfo belum didapat, cari member Kepala Keluarga di KK ini & auto-link userId jika belum terhubung
      if (!memberInfo) {
        const [headMember] = await db
          .select({
            id: schema.familyMembers.id,
            familyId: schema.familyMembers.familyId,
            relationship: schema.familyMembers.relationship,
            nik: schema.familyMembers.nik,
            name: schema.familyMembers.name,
            phone: schema.familyMembers.phone,
          })
          .from(schema.familyMembers)
          .where(and(eq(schema.familyMembers.familyId, fam.id), eq(schema.familyMembers.relationship, 'Kepala_Keluarga'), eq(schema.familyMembers.isActive, true)))
          .limit(1);

        if (headMember) {
          memberInfo = headMember;
          // Auto-link userId ke record familyMembers ini jika NULL
          await db
            .update(schema.familyMembers)
            .set({ userId })
            .where(eq(schema.familyMembers.id, headMember.id));
        }
      }
    }
  }

  // Format dwellingInfo untuk konsistensi tampilan di UI profil
  const dwellingInfo = familyData?.blockNumber
    ? {
        id: familyData.dwellingId,
        blockNumber: familyData.blockNumber,
        houseNumber: familyData.houseNumber,
        type: familyData.dwellingType || 'permanen',
      }
    : null;

  return {
    ...user,
    nik: memberInfo?.nik ?? null,
    familyNumber: familyData?.familyNumber ?? null,
    roleId: primaryRole?.roleId ?? 6,
    roleName: primaryRole?.roleName ?? 'Warga',
    roleSlug: primaryRole?.roleSlug ?? 'warga',
    roleIds: roles.map((r) => r.roleId),
    familyInfo: familyData ?? null,
    dwellingInfo,
    memberInfo: memberInfo ?? null,
    residentInfo: memberInfo ?? null,
  };
}

/**
 * Ambil daftar semua role yang dimiliki seorang user (via user_roles).
 */
export async function getUserRoles(userId: string): Promise<number[]> {
  try {
    const records = await db
      .select({ roleId: schema.userRoles.roleId })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, userId));

    if (records.length > 0) {
      return records.map((r) => r.roleId);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Cek apakah koordinator belum memiliki password (belum registrasi lengkap).
 */
export async function getPendingCoordInfo(id: string) {
  const [user] = await db
    .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone })
    .from(schema.users)
    .innerJoin(schema.userRoles, and(eq(schema.users.id, schema.userRoles.userId), eq(schema.userRoles.roleId, 5)))
    .where(and(eq(schema.users.id, id), isNull(schema.users.password)))
    .limit(1);

  return user ?? null;
}

// ==========================================
// WRITE QUERIES
// ==========================================

/**
 * Buat akun pengguna baru beserta credential Better Auth.
 * Otomatis set user_roles sesuai roleId yang diberikan.
 */
export async function createUserWithAccount(input: CreateUserInput) {
  // Tentukan list roleIds (jika menyertakan Super Admin 1, paksa menjadi [1] eksklusif)
  let roleIds: number[] = Array.isArray((input as any).roles) && (input as any).roles.length > 0
    ? (input as any).roles
    : [input.roleId ?? 6];

  if (roleIds.includes(1)) {
    roleIds = [1];
  }

  // Cek duplikasi email
  const [existingEmail] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, input.email))
    .limit(1);
  if (existingEmail) throw new Error('EMAIL_EXISTS');

  // Cek jabatan pengurus tunggal (Ketua RT: 2, Sekretaris: 3, Bendahara: 4)
  for (const rId of roleIds) {
    if ([2, 3, 4].includes(rId)) {
      const existingOfficer = await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.userRoles)
        .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
        .where(and(eq(schema.userRoles.roleId, rId), ne(schema.users.status, 'suspended')))
        .limit(1);
      if (existingOfficer.length > 0) {
        const roleNames: Record<number, string> = { 2: 'Ketua RT', 3: 'Sekretaris', 4: 'Bendahara' };
        throw new Error(`OFFICER_EXISTS:${roleNames[rId]}:${existingOfficer[0].name}`);
      }
    }
  }

  // Cek limit Super Admin (max 2)
  if (roleIds.includes(1)) {
    const admins = await db
      .select({ id: schema.users.id })
      .from(schema.userRoles)
      .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
      .where(and(eq(schema.userRoles.roleId, 1), ne(schema.users.status, 'suspended')));
    if (admins.length >= 2) throw new Error('SUPERADMIN_LIMIT_REACHED');
  }

  // Cek Alamat Hunian jika role Warga (6) -> Tidak boleh homestay
  if (roleIds.includes(6) && input.dwellingId) {
    const [dwelling] = await db
      .select({ id: schema.dwellings.id, type: schema.dwellings.type })
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, input.dwellingId))
      .limit(1);

    if (!dwelling || dwelling.type === 'homestay') {
      throw new Error('INVALID_DWELLING:Alamat hunian tidak valid atau bertipe Homestay.');
    }
  }

  const rawPassword = input.password && input.password.trim() !== '' 
    ? input.password 
    : Math.random().toString(36).slice(-8) + 'A1!';
  const hashedPassword = await hashPassword(rawPassword);
  const userId = randomUUID();
  const userStatus = input.status ?? 'active';

  const primaryRoleId = roleIds.find((r) => r !== 6) ?? roleIds[0];

  await db.transaction(async (tx) => {
    // 1. Insert User
    await tx.insert(schema.users).values({
      id: userId,
      name: input.name,
      email: input.email,
      password: hashedPassword,
      phone: input.phone ?? null,
      status: userStatus,
      emailVerified: userStatus === 'active',
    });

    // 2. Insert User Roles
    for (const rId of roleIds) {
      await tx.insert(schema.userRoles).values({
        userId,
        roleId: rId,
        isPrimary: rId === primaryRoleId,
      }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    }

    // 3. Insert Account
    await tx.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: input.email,
      providerId: 'credential',
      userId,
      password: hashedPassword,
    });

    // 4. Auto-Link jika role Warga (6) dan input.nik ada
    let isAutoLinked = false;
    if (roleIds.includes(6) && input.nik && input.nik.trim() !== '') {
      const cleanNik = input.nik.trim();
      const [existingMember] = await tx
        .select({
          id: schema.familyMembers.id,
          familyId: schema.familyMembers.familyId,
          userId: schema.familyMembers.userId,
          relationship: schema.familyMembers.relationship,
          isActive: schema.familyMembers.isActive,
        })
        .from(schema.familyMembers)
        .where(eq(schema.familyMembers.nik, cleanNik))
        .limit(1);

      if (existingMember) {
        if (existingMember.userId) {
          throw new Error('NIK_ALREADY_LINKED:NIK ini sudah terhubung dengan akun lain.');
        }

        // Tautkan akun baru ini ke member
        await tx.update(schema.familyMembers)
          .set({ userId, updatedAt: new Date() })
          .where(eq(schema.familyMembers.id, existingMember.id));

        if (existingMember.relationship === 'Kepala_Keluarga' && existingMember.isActive) {
          // Tautkan juga sebagai owner KK
          await tx.update(schema.families)
            .set({ headUserId: userId, updatedAt: new Date() })
            .where(eq(schema.families.id, existingMember.familyId));
          isAutoLinked = true; // Sudah ditautkan ke KK yang ada
        } else {
          // Jika dia bukan kepala keluarga di tempat lama (pecah KK), non-aktifkan di tempat lama
          await tx
            .update(schema.familyMembers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(schema.familyMembers.id, existingMember.id));
        }
      }
    }

    // 5. Jika role Warga (6), BELUM tertaut ke KK, dan dwellingId diisi -> Buat data KK baru (Fast Track Admin)
    if (roleIds.includes(6) && !isAutoLinked && input.dwellingId) {
      const familyNo = input.familyNumber && input.familyNumber.trim() !== ''
        ? input.familyNumber.trim()
        : `${Date.now()}`.slice(0, 16);
      
      const cleanNik = input.nik ? input.nik.trim() : `${Date.now()}`.slice(0, 16);

      // Cek duplikasi Nomor KK
      if (input.familyNumber && input.familyNumber.trim() !== '') {
        const [existingFam] = await tx
          .select({ id: schema.families.id, headUserId: schema.families.headUserId })
          .from(schema.families)
          .where(and(eq(schema.families.familyNumber, familyNo), eq(schema.families.isActive, true)))
          .limit(1);

        if (existingFam && existingFam.headUserId) {
          throw new Error('FAMILY_NUMBER_EXISTS:Nomor KK ini sudah terdaftar dengan Kepala Keluarga lain.');
        }
      }

      // Jika dibuat langsung oleh admin (active) -> verified, jika registrasi mandiri (pending) -> draft
      const initialVerification = userStatus === 'active' ? 'verified' : 'draft';

      const [newFamRes] = await tx.insert(schema.families).values({
        familyNumber: familyNo,
        headUserId: userId,
        dwellingId: input.dwellingId,
        verificationStatus: initialVerification,
        isActive: true,
      });

      const familyId = newFamRes.insertId;

      await tx.insert(schema.familyMembers).values({
        familyId: familyId,
        userId: userId,
        nik: cleanNik,
        name: input.name,
        gender: input.gender ?? 'L',
        relationship: 'Kepala_Keluarga',
        phone: input.phone ?? null,
      });
    }

    // 6. Jika role Koordinator Kos (5) dan rentalPropertyId diisi & status active -> update property
    if (roleIds.includes(5) && (input as any).rentalPropertyId && userStatus === 'active') {
      await tx
        .update(schema.rentalProperties)
        .set({ coordinatorUserId: userId, updatedAt: new Date() })
        .where(eq(schema.rentalProperties.id, (input as any).rentalPropertyId));
    }
  });

  return { 
    id: userId, 
    name: input.name, 
    email: input.email, 
    roleId: primaryRoleId,
    roleIds,
    generatedPassword: rawPassword,
  };
}

/**
 * Memungkinkan pengguna terdaftar (Pengurus/Koor) membuat KK & menjadi Kepala Keluarga
 * tanpa perlu mendaftar akun baru.
 */
export async function claimWargaForExistingUser(
  userId: string,
  input: {
    dwellingId: number;
    familyNumber: string;
    nik: string;
    gender?: 'L' | 'P';
  }
) {
  const [user] = await db
    .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone, status: schema.users.status })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) throw new Error('USER_NOT_FOUND');

  const userRoles = await getUserRoles(userId);
  if (userRoles.includes(1)) {
    throw new Error('FORBIDDEN_ADMIN_KK:Akun Super Admin tidak dapat mendaftarkan Kartu Keluarga. Gunakan akun Warga terpisah.');
  }

  const [existingHead] = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
    .limit(1);
  if (existingHead) throw new Error('FAMILY_ALREADY_EXISTS:Akun Anda sudah terdaftar sebagai Kepala Keluarga.');

  const [dwelling] = await db
    .select({ id: schema.dwellings.id, type: schema.dwellings.type })
    .from(schema.dwellings)
    .where(eq(schema.dwellings.id, input.dwellingId))
    .limit(1);
  if (!dwelling || dwelling.type === 'homestay') {
    throw new Error('INVALID_DWELLING:Alamat hunian tidak valid atau bertipe Homestay.');
  }

  const cleanNik = input.nik.trim();
  const cleanFamilyNo = input.familyNumber.trim();

  return await db.transaction(async (tx) => {
    // 1. Pastikan user memiliki Role Warga (6)
    const currentRoles = await getUserRoles(userId);
    if (!currentRoles.includes(6)) {
      const newRoles = [...currentRoles, 6];
      const primaryRole = currentRoles[0] || 6;
      for (const rId of newRoles) {
        await tx.insert(schema.userRoles).values({
          userId,
          roleId: rId,
          isPrimary: rId === primaryRole,
        }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
      }
    }

    // 2. Auto-Link jika NIK sudah ada di sistem fisik (Dibuat Pak RT)
    if (cleanNik) {
      const [existingNikMember] = await tx
        .select({ id: schema.familyMembers.id, familyId: schema.familyMembers.familyId, userId: schema.familyMembers.userId, relationship: schema.familyMembers.relationship, isActive: schema.familyMembers.isActive })
        .from(schema.familyMembers)
        .where(eq(schema.familyMembers.nik, cleanNik))
        .limit(1);

      if (existingNikMember) {
        if (existingNikMember.userId && existingNikMember.userId !== userId) {
          throw new Error('NIK_ALREADY_LINKED:NIK ini sudah terhubung dengan akun Kepala Keluarga lain.');
        }

        // Tautkan akun ke member fisik ini
        await tx.update(schema.familyMembers).set({ userId, updatedAt: new Date() }).where(eq(schema.familyMembers.id, existingNikMember.id));

        if (existingNikMember.relationship === 'Kepala_Keluarga' && existingNikMember.isActive) {
           // Tautkan juga sebagai kepala keluarga di tabel families
           await tx.update(schema.families).set({ headUserId: userId, updatedAt: new Date() }).where(eq(schema.families.id, existingNikMember.familyId));
           return { familyId: existingNikMember.familyId }; // Langsung kembalikan sukses, tidak perlu buat baru
        } else {
           // Jika dia bukan kepala keluarga di tempat lama (pecah KK mandiri), non-aktifkan di tempat lama dan lanjut buat KK baru
           await tx.update(schema.familyMembers).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.familyMembers.id, existingNikMember.id));
        }
      }
    }

    // 3. Jika NIK tidak ditemukan atau bukan Kepala Keluarga, buat KK Baru
    const [existingFam] = await tx
      .select({ id: schema.families.id, headUserId: schema.families.headUserId })
      .from(schema.families)
      .where(and(eq(schema.families.familyNumber, cleanFamilyNo), eq(schema.families.isActive, true)))
      .limit(1);
      
    if (existingFam && existingFam.headUserId) {
      throw new Error('FAMILY_NUMBER_EXISTS:Nomor KK ini sudah terdaftar dengan Kepala Keluarga lain.');
    }

    // Buat keluarga baru secara mandiri, status wajib DRAFT
    const [newFamRes] = await tx.insert(schema.families).values({
      familyNumber: cleanFamilyNo,
      headUserId: userId,
      dwellingId: input.dwellingId,
      verificationStatus: 'draft',
      isActive: true,
    });
    const familyId = newFamRes.insertId;

    await tx.insert(schema.familyMembers).values({
      familyId,
      userId,
      nik: cleanNik,
      name: user.name,
      gender: input.gender ?? 'L',
      relationship: 'Kepala_Keluarga',
      phone: user.phone ?? null,
      isActive: true,
    });

    return { familyId };
  });
}


/**
 * Perbarui data profil dasar pengguna (nama, email, telepon).
 */
export async function updateUserProfile(
  id: string,
  data: { name: string; email: string; phone?: string | null }
) {
  const [existingEmail] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, data.email), ne(schema.users.id, id)))
    .limit(1);
  if (existingEmail) throw new Error('EMAIL_EXISTS');

  // Self-role-change protection handled separately via setUserRoles
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ name: data.name, email: data.email, phone: data.phone ?? null, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    await tx
      .update(schema.accounts)
      .set({ accountId: data.email })
      .where(eq(schema.accounts.userId, id));
      
    // Sinkronisasi data ke tabel Warga (family_members)
    await tx
      .update(schema.familyMembers)
      .set({ name: data.name, phone: data.phone ?? null, updatedAt: new Date() })
      .where(eq(schema.familyMembers.userId, id));
  });
}

/**
 * Update data photo/image dan nomor telepon pengguna.
 */
export async function updateUserProfileData(
  userId: string,
  data: { name?: string; phone?: string; image?: string }
) {
  const payload: Record<string, any> = { updatedAt: new Date() };
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.image !== undefined) {
    payload.image = data.image;
    payload.photo = data.image;
  }

  await db.update(schema.users).set(payload).where(eq(schema.users.id, userId));

  // Sync nomor telepon dan nama ke family_members jika terhubung
  if (data.phone !== undefined || data.name !== undefined) {
    const familyPayload: Record<string, any> = { updatedAt: new Date() };
    if (data.phone !== undefined) familyPayload.phone = data.phone;
    if (data.name !== undefined) familyPayload.name = data.name;

    await db
      .update(schema.familyMembers)
      .set(familyPayload)
      .where(eq(schema.familyMembers.userId, userId));
  }

  return getUserFullProfile(userId);
}

/**
 * Suspend atau aktifkan kembali akun pengguna.
 */
export async function suspendToggleUser(id: string, status: 'active' | 'suspended', sessionUserId: string) {
  if (id === sessionUserId) throw new Error('SELF_SUSPEND');

  const [targetUser] = await db
    .select({ id: schema.users.id })
    .from(schema.userRoles)
    .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
    .where(and(eq(schema.users.id, id), eq(schema.userRoles.roleId, 1)))
    .limit(1);

  if (targetUser) throw new Error('SA_MUTUAL_PROTECTION');

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    if (status === 'suspended') {
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    }
  });
}

/**
 * Reset password pengguna ke password default.
 */
export async function resetUserPassword(id: string, defaultPassword: string) {
  const hashedPassword = await hashPassword(defaultPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    const [existingAccount] = await tx
      .select({ id: schema.accounts.id })
      .from(schema.accounts)
      .where(and(eq(schema.accounts.userId, id), eq(schema.accounts.providerId, 'credential')))
      .limit(1);

    if (existingAccount) {
      await tx
        .update(schema.accounts)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(and(eq(schema.accounts.userId, id), eq(schema.accounts.providerId, 'credential')));
    } else {
      const [u] = await tx.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
      await tx.insert(schema.accounts).values({
        id: randomUUID(),
        accountId: u?.email ?? '',
        providerId: 'credential',
        userId: id,
        password: hashedPassword,
      });
    }
  });
}

/**
 * Selesaikan registrasi koordinator kos (isi email, password).
 */
export async function registerCoord(id: string, email: string, nik: string, passwordHash: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .innerJoin(schema.userRoles, and(eq(schema.users.id, schema.userRoles.userId), eq(schema.userRoles.roleId, 5)))
    .where(and(eq(schema.users.id, id), isNull(schema.users.password)))
    .limit(1);

  if (!user) throw new Error('NOT_FOUND');

  const [conflict] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(and(ne(schema.users.id, id), eq(schema.users.email, email)))
    .limit(1);

  if (conflict) {
    if (conflict.email === email) throw new Error('EMAIL_EXISTS');
  }

  await db
    .update(schema.users)
    .set({ email, password: passwordHash, emailVerified: true, updatedAt: new Date() })
    .where(eq(schema.users.id, id));

  try {
    await notifyRoles(['ketua-rt', 'sekretaris'], {
      title: 'Registrasi Koordinator Baru',
      message: `Koordinator bernama ${user.users.name} telah menyelesaikan pendaftaran. Silakan tinjau.`,
      category: 'dinas',
      redirectLink: '/dashboard/approvals/registration',
    });
  } catch (err) {
    console.error('Gagal mengirim notifikasi registrasi koordinator:', err);
  }
}

// ==========================================
// ROLE MANAGEMENT
// ==========================================

/**
 * Set ulang seluruh role seorang user.
 * Validasi: Max 1 jabatan pengurus RT, kepala keluarga wajib punya role Warga (6).
 */
export async function setUserRoles(userId: string, roleIds: number[], primaryRoleId?: number) {
  const validRoleIds = Array.from(new Set(roleIds.filter((id) => id >= 1 && id <= 6)));

  // Ambil role akun saat ini
  const currentRoles = await getUserRoles(userId);
  const isCurrentlyAdmin = currentRoles.includes(1);
  const isTargetingAdmin = validRoleIds.includes(1);

  // Aturan 1: Akun non-admin TIDAK BISA di-upgrade/dipromosikan menjadi Admin
  if (!isCurrentlyAdmin && isTargetingAdmin) {
    throw new Error('FORBIDDEN_ADMIN_PROMOTION:Akun Warga/Pengurus/Koordinator tidak dapat diubah menjadi Super Admin. Buat akun Admin baru dari awal.');
  }

  // Aturan 2: Akun Admin TIDAK BISA didemosi/diubah menjadi non-admin
  if (isCurrentlyAdmin && !isTargetingAdmin) {
    throw new Error('FORBIDDEN_ADMIN_DEMOTION:Akun Super Admin tidak dapat diubah menjadi Warga atau Pengurus. Gunakan fitur penangguhan (suspend) jika akun tidak digunakan.');
  }

  // Aturan 3: Admin adalah Exclusive Single Role [1]
  if (isTargetingAdmin && validRoleIds.length > 1) {
    throw new Error('ADMIN_SINGLE_ROLE_EXCLUSIVE:Akun Super Admin bersifat eksklusif dan tidak dapat digabungkan dengan role lain.');
  }

  // Max 1 jabatan pengurus RT
  const officerRolesInInput = validRoleIds.filter((id) => [2, 3, 4].includes(id));
  if (officerRolesInInput.length > 1) throw new Error('MULTIPLE_OFFICER_ROLES_FORBIDDEN');

  // Kepala keluarga wajib punya role Warga
  const [familyHead] = await db
    .select({ id: schema.families.id })
    .from(schema.families)
    .where(and(eq(schema.families.headUserId, userId), eq(schema.families.isActive, true)))
    .limit(1);
  if (familyHead && !validRoleIds.includes(6)) throw new Error('HEAD_OF_FAMILY_WARGA_REQUIRED');

  const primary = primaryRoleId && validRoleIds.includes(primaryRoleId) ? primaryRoleId : (validRoleIds[0] ?? null);

  await db.transaction(async (tx) => {
    await tx.delete(schema.userRoles).where(eq(schema.userRoles.userId, userId));
    if (validRoleIds.length > 0) {
      const newRoles = validRoleIds.map((rId) => ({ userId, roleId: rId, isPrimary: rId === primary }));
      await tx.insert(schema.userRoles).values(newRoles);
    }
  });

  return true;
}

/**
 * Mutasi jabatan pengurus RT.
 */
export async function mutateOfficerRole(targetUserId: string, newOfficerRoleId: number | null, sessionUserId: string) {
  if (targetUserId === sessionUserId) throw new Error('SELF_ROLE_CHANGE');

  const [isSa] = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, targetUserId), eq(schema.userRoles.roleId, 1)))
    .limit(1);
  if (isSa) throw new Error('SA_MUTUAL_PROTECTION');

  if (newOfficerRoleId !== null && [2, 3, 4].includes(newOfficerRoleId)) {
    const [existingOfficer] = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.userRoles)
      .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
      .where(and(eq(schema.userRoles.roleId, newOfficerRoleId), ne(schema.users.status, 'suspended'), ne(schema.users.id, targetUserId)))
      .limit(1);
    if (existingOfficer) {
      const roleNames: Record<number, string> = { 2: 'Ketua RT', 3: 'Sekretaris', 4: 'Bendahara' };
      throw new Error(`OFFICER_POSITION_OCCUPIED:${roleNames[newOfficerRoleId]}:${existingOfficer.name}`);
    }
  }

  const currentRoles = await getUserRoles(targetUserId);
  const newRolesList = currentRoles.filter((r) => ![2, 3, 4].includes(r));
  if (newOfficerRoleId !== null && [2, 3, 4].includes(newOfficerRoleId)) newRolesList.push(newOfficerRoleId);

  const primaryRole = newOfficerRoleId ?? (newRolesList[0] || undefined);
  return setUserRoles(targetUserId, newRolesList, primaryRole);
}

/**
 * Mencari user berdasarkan phone atau membuat user pending koordinator baru.
 */
export async function findOrCreatePendingCoordinatorByPhone(name: string, phone: string) {
  const cleanPhone = phone.replace(/[-\s]/g, "");

  const [existingUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.phone, cleanPhone))
    .limit(1);

  if (existingUser) {
    return existingUser.id;
  }

  const newUserId = randomUUID();
  const tempEmail = `pending-${cleanPhone}-${Math.random().toString(36).substring(2, 7)}@wargaku.temp`;

  await db.insert(schema.users).values({
    id: newUserId,
    name,
    email: tempEmail,
    phone: cleanPhone,
    status: "pending",
    emailVerified: false,
  });

  await db.insert(schema.userRoles).values({
    userId: newUserId,
    roleId: 5,
    isPrimary: true,
  });

  return newUserId;
}

export const createCoordinatorSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional().nullable(),
  dwellingId: z.number().int(),
});

export async function listCoordinators() {
  const coordUsers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.userRoles, eq(schema.users.id, schema.userRoles.userId))
    .where(eq(schema.userRoles.roleId, 5));

  // For each coordinator, fetch their properties
  const results = await Promise.all(
    coordUsers.map(async (user) => {
      // Get properties assigned to this coordinator, joining with dwellings to get owner
      const properties = await db
        .select({
          id: schema.rentalProperties.id,
          name: schema.rentalProperties.name,
          ownerUserId: schema.dwellings.ownerUserId,
        })
        .from(schema.rentalProperties)
        .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
        .where(eq(schema.rentalProperties.coordinatorUserId, user.id));

      const propertiesWithOwnership = properties.map((prop) => ({
        id: prop.id,
        name: prop.name,
        isOwnedByCoordinator: prop.ownerUserId === user.id,
      }));

      return {
        ...user,
        properties: propertiesWithOwnership,
        propertiesCount: properties.length,
      };
    })
  );

  return results;
}

export async function createCoordinator(input: { name: string; email: string; phone?: string | null; dwellingId: number }) {
  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1);
  let targetUserId = existingUser?.id;
  let isNewUserCreated = false;
  let generatedPassword = '';

  if (!targetUserId) {
    generatedPassword = `Coord#${Math.floor(1000 + Math.random() * 9000)}`;
    const newUserId = randomUUID();
    const hashedPassword = await hashPassword(generatedPassword);
    await db.insert(schema.users).values({
      id: newUserId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.accounts).values({
      id: randomUUID(),
      userId: newUserId,
      accountId: input.email,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    targetUserId = newUserId;
    isNewUserCreated = true;
  }

  await db.insert(schema.userRoles).values({
    userId: targetUserId,
    roleId: 5,
    isPrimary: false,
  }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

  await db
    .update(schema.rentalProperties)
    .set({ coordinatorUserId: targetUserId })
    .where(eq(schema.rentalProperties.dwellingId, input.dwellingId));

  return {
    targetUserId,
    isNewUserCreated,
    generatedPassword,
    emailSentSuccessfully: true,
  };
}

export async function revokeCoordinatorFromProperties(coordinatorUserId: string, propertyIds: number[]) {
  if (!propertyIds || propertyIds.length === 0) return 0;

  // 1. Fetch properties and their owners
  const propertiesToRevoke = await db
    .select({
      id: schema.rentalProperties.id,
      ownerUserId: schema.dwellings.ownerUserId,
    })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(inArray(schema.rentalProperties.id, propertyIds));

  // 2. Set coordinatorUserId = ownerUserId for these properties
  for (const prop of propertiesToRevoke) {
    if (prop.ownerUserId) {
      await db
        .update(schema.rentalProperties)
        .set({ coordinatorUserId: prop.ownerUserId })
        .where(eq(schema.rentalProperties.id, prop.id));

      // 3. Ensure the owner has the Coordinator role (roleId: 5)
      await db.insert(schema.userRoles).values({
        userId: prop.ownerUserId,
        roleId: 5,
        isPrimary: false,
      }).onDuplicateKeyUpdate({ set: { id: sql`id` } });
    } else {
      // If no owner found, just nullify
      await db
        .update(schema.rentalProperties)
        .set({ coordinatorUserId: sql`NULL` })
        .where(eq(schema.rentalProperties.id, prop.id));
    }
  }

  // 4. Check if the original coordinator still manages any properties
  const remainingProperties = await db
    .select({ id: schema.rentalProperties.id })
    .from(schema.rentalProperties)
    .where(eq(schema.rentalProperties.coordinatorUserId, coordinatorUserId))
    .limit(1);

  // If they don't manage any more properties, revoke their Coordinator role
  if (remainingProperties.length === 0) {
    await db
      .delete(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, coordinatorUserId),
          eq(schema.userRoles.roleId, 5)
        )
      );
  }

  return propertiesToRevoke.length;
}
