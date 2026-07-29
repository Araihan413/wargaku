import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, or, like, desc, sql, notInArray, ne, isNull } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

export interface ListUsersOptions {
  limit?: number;
  offset?: number;
  roleId?: number;
  status?: "pending" | "active" | "suspended";
  query?: string;
  withoutFamily?: boolean;
  excludeExceptId?: string;
}

export async function listUsers(options: ListUsersOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const conditions = [];

  if (options.roleId !== undefined) {
    conditions.push(eq(schema.users.roleId, options.roleId));
  }
  if (options.status !== undefined) {
    conditions.push(eq(schema.users.status, options.status));
  }
  if (options.query) {
    conditions.push(
      or(
        like(schema.users.name, `%${options.query}%`),
        like(schema.users.email, `%${options.query}%`),
        like(schema.users.nik, `%${options.query}%`)
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

    if (headUserIds.length > 0) {
      conditions.push(notInArray(schema.users.id, headUserIds));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      nik: schema.users.nik,
      phone: schema.users.phone,
      photo: schema.users.photo,
      status: schema.users.status,
      roleId: schema.users.roleId,
      roleName: schema.roles.name,
      roleSlug: schema.roles.slug,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.users.createdAt));

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
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
}

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

export async function createUserWithAccount(validatedData: CreateUserInput) {
  // Check if email already exists
  const existingUserByEmail = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, validatedData.email))
    .limit(1);

  if (existingUserByEmail.length > 0) {
    throw new Error("EMAIL_EXISTS");
  }

  // Check if NIK already exists
  if (validatedData.nik) {
    const existingUserByNik = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.nik, validatedData.nik))
      .limit(1);

    if (existingUserByNik.length > 0) {
      throw new Error("NIK_EXISTS");
    }
  }

  // Check if role is an RT officer (Ketua RT = 2, Sekretaris = 3, Bendahara = 4) and already exists
  if ([2, 3, 4].includes(validatedData.roleId)) {
    const existingOfficer = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.roleId, validatedData.roleId),
          ne(schema.users.status, "suspended")
        )
      )
      .limit(1);

    if (existingOfficer.length > 0) {
      const roleNames: Record<number, string> = {
        2: "Ketua RT",
        3: "Sekretaris",
        4: "Bendahara",
      };
      const officerRoleName = roleNames[validatedData.roleId];
      throw new Error(`OFFICER_EXISTS:${officerRoleName}:${existingOfficer[0].name}`);
    }
  }

  // Check Super Admin count limit (max 2 active/pending)
  if (validatedData.roleId === 1) {
    const existingSuperAdmins = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.roleId, 1),
          ne(schema.users.status, "suspended")
        )
      );

    if (existingSuperAdmins.length >= 2) {
      throw new Error("SUPERADMIN_LIMIT_REACHED");
    }
  }

  const hashedPassword = await hashPassword(validatedData.password);
  const userId = randomUUID();

  const newUser = await db.transaction(async (tx) => {
    // 1. Insert user
    await tx.insert(schema.users).values({
      id: userId,
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      nik: validatedData.nik || null,
      phone: validatedData.phone || null,
      roleId: validatedData.roleId,
      status: validatedData.status || "active",
      emailVerified: false,
      familyNumber: validatedData.familyNumber || null,
      dwellingId: validatedData.dwellingId || null,
      unitNumber: validatedData.unitNumber || null,
    });

    // 2. Insert account for Better Auth credentials
    await tx.insert(schema.accounts).values({
      id: randomUUID(),
      accountId: validatedData.email,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    });

    // 3. Auto-create family records if role is Warga and status is active
    if (validatedData.roleId === 6 && (validatedData.status || "active") === "active") {
      if (validatedData.dwellingId && validatedData.familyNumber && validatedData.nik) {
        const [insertFamily] = await tx.insert(schema.families).values({
          dwellingId: validatedData.dwellingId,
          familyNumber: validatedData.familyNumber,
          headUserId: userId,
          headName: validatedData.name,
          unitNumber: validatedData.unitNumber || null,
          verificationStatus: "verified",
          hasVerified: true,
          lastVerifiedAt: new Date(),
          checkInDate: new Date(),
          isActive: true,
        });

        const familyId = insertFamily.insertId;

        // Add Head of Family to residents table
        await tx.insert(schema.residents).values({
          familyId,
          dwellingId: validatedData.dwellingId,
          userId: userId,
          residentType: "warga_tetap",
          name: validatedData.name,
          nik: validatedData.nik,
          relationship: "Kepala_Keluarga",
          gender: validatedData.gender || "L",
          phone: validatedData.phone || null,
          verificationStatus: "verified",
          isActive: true,
        });
      }
    }

    return {
      id: userId,
      name: validatedData.name,
      email: validatedData.email,
      nik: validatedData.nik || null,
      phone: validatedData.phone || null,
      roleId: validatedData.roleId,
      status: validatedData.status || "active",
    };
  });

  return newUser;
}

export async function updateUserProfile(id: string, validatedData: UpdateUserInput, sessionUserId: string) {
  // Fetch target user info
  const targetUser = await db
    .select({ roleId: schema.users.roleId })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  const targetRoleId = targetUser[0]?.roleId;

  // Self-protection
  if (id === sessionUserId && validatedData.roleId !== targetRoleId) {
    throw new Error("SELF_ROLE_CHANGE");
  }

  // Mutual SA protection
  if (targetRoleId === 1 && id !== sessionUserId) {
    throw new Error("SA_MUTUAL_PROTECTION");
  }

  // Cannot promote anyone to SA via profile update
  if (validatedData.roleId === 1 && targetRoleId !== 1) {
    throw new Error("SA_PROMOTION_FORBIDDEN");
  }

  // Check NIK duplicate
  if (validatedData.nik) {
    const existingUserByNik = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.nik, validatedData.nik),
          ne(schema.users.id, id)
        )
      )
      .limit(1);

    if (existingUserByNik.length > 0) {
      throw new Error("NIK_EXISTS");
    }
  }

  // Check Email duplicate
  const existingUserByEmail = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.email, validatedData.email),
        ne(schema.users.id, id)
      )
    )
    .limit(1);

  if (existingUserByEmail.length > 0) {
    throw new Error("EMAIL_EXISTS");
  }

  // Check duplicate officer if role changes
  if ([2, 3, 4].includes(validatedData.roleId)) {
    const existingOfficer = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.roleId, validatedData.roleId),
          ne(schema.users.status, "suspended"),
          ne(schema.users.id, id)
        )
      )
      .limit(1);

    if (existingOfficer.length > 0) {
      const roleNames: Record<number, string> = {
        2: "Ketua RT",
        3: "Sekretaris",
        4: "Bendahara",
      };
      const officerRoleName = roleNames[validatedData.roleId];
      throw new Error(`OFFICER_EXISTS:${officerRoleName}:${existingOfficer[0].name}`);
    }
  }

  // Update profile and credentials email in transaction
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({
        name: validatedData.name,
        email: validatedData.email,
        nik: validatedData.nik || null,
        phone: validatedData.phone || null,
        roleId: validatedData.roleId,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));

    await tx
      .update(schema.accounts)
      .set({ accountId: validatedData.email })
      .where(eq(schema.accounts.userId, id));
  });
}

export async function mutateUserRole(id: string, roleId: number, sessionUserId: string) {
  const targetUserForMutate = await db
    .select({ roleId: schema.users.roleId })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  const targetRoleIdForMutate = targetUserForMutate[0]?.roleId;

  if (id === sessionUserId) {
    throw new Error("SELF_ROLE_CHANGE");
  }

  if (targetRoleIdForMutate === 1) {
    throw new Error("SA_MUTUAL_PROTECTION");
  }

  if (roleId === 1) {
    throw new Error("SA_PROMOTION_FORBIDDEN");
  }

  if ([2, 3, 4].includes(roleId)) {
    const existingOfficer = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.roleId, roleId),
          ne(schema.users.status, "suspended"),
          ne(schema.users.id, id)
        )
      )
      .limit(1);

    if (existingOfficer.length > 0) {
      const roleNames: Record<number, string> = {
        2: "Ketua RT",
        3: "Sekretaris",
        4: "Bendahara",
      };
      const officerRoleName = roleNames[roleId];
      throw new Error(`OFFICER_EXISTS:${officerRoleName}:${existingOfficer[0].name}`);
    }
  }

  await db
    .update(schema.users)
    .set({ roleId, updatedAt: new Date() })
    .where(eq(schema.users.id, id));
}

export async function suspendToggleUser(id: string, status: "active" | "suspended", sessionUserId: string) {
  if (id === sessionUserId) {
    throw new Error("SELF_SUSPEND");
  }

  const targetUserForSuspend = await db
    .select({ roleId: schema.users.roleId })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);

  if (targetUserForSuspend[0]?.roleId === 1) {
    throw new Error("SA_MUTUAL_PROTECTION");
  }

  if (status === "active" && targetUserForSuspend.length > 0) {
    const targetRoleId = targetUserForSuspend[0].roleId;

    if (targetRoleId === 1) {
      const existingSuperAdmins = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.roleId, 1),
            ne(schema.users.status, "suspended")
          )
        );

      if (existingSuperAdmins.length >= 2) {
        throw new Error("SUPERADMIN_LIMIT_REACHED");
      }
    }

    if ([2, 3, 4].includes(targetRoleId)) {
      const existingOfficer = await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(
          and(
            eq(schema.users.roleId, targetRoleId),
            ne(schema.users.status, "suspended"),
            ne(schema.users.id, id)
          )
        )
        .limit(1);

      if (existingOfficer.length > 0) {
        const roleNames: Record<number, string> = {
          2: "Ketua RT",
          3: "Sekretaris",
          4: "Bendahara",
        };
        const officerRoleName = roleNames[targetRoleId];
        throw new Error(`OFFICER_EXISTS_ACTIVATION:${officerRoleName}:${existingOfficer[0].name}`);
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    if (status === "active") {
      const [user] = await tx
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          nik: schema.users.nik,
          phone: schema.users.phone,
          roleId: schema.users.roleId,
          familyNumber: schema.users.familyNumber,
          dwellingId: schema.users.dwellingId,
          unitNumber: schema.users.unitNumber,
        })
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      if (user && user.roleId === 6) {
        const [existingFamily] = await tx
          .select({ id: schema.families.id })
          .from(schema.families)
          .where(eq(schema.families.headUserId, id))
          .limit(1);

        if (!existingFamily) {
          const targetDwellingId = user.dwellingId;

          if (targetDwellingId && user.familyNumber && user.nik) {
            const [insertFamily] = await tx.insert(schema.families).values({
              dwellingId: targetDwellingId,
              familyNumber: user.familyNumber,
              headUserId: id,
              headName: user.name,
              unitNumber: user.unitNumber || null,
              verificationStatus: "draft",
              checkInDate: new Date(),
              isActive: true,
            });

            const familyId = insertFamily.insertId;

            await tx.insert(schema.residents).values({
              familyId,
              dwellingId: targetDwellingId,
              userId: id,
              residentType: "warga_tetap",
              name: user.name,
              nik: user.nik,
              relationship: "Kepala_Keluarga",
              gender: "L",
              phone: user.phone || null,
              verificationStatus: "verified",
              isActive: true,
            });
          }
        }
      }
    }
  });
}

export async function resetUserPassword(id: string, defaultPassword: string) {
  const hashedPassword = await hashPassword(defaultPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, id));

    const existingAccount = await tx
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, id),
          eq(schema.accounts.providerId, "credential")
        )
      )
      .limit(1);

    if (existingAccount.length > 0) {
      await tx
        .update(schema.accounts)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(
          and(
            eq(schema.accounts.userId, id),
            eq(schema.accounts.providerId, "credential")
          )
        );
    } else {
      const targetUser = await tx
        .select({ email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);
      
      const email = targetUser[0]?.email || "";

      await tx.insert(schema.accounts).values({
        id: randomUUID(),
        accountId: email,
        providerId: "credential",
        userId: id,
        password: hashedPassword,
      });
    }
  });
}

export async function getPendingCoordInfo(id: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      phone: schema.users.phone,
    })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.id, id),
        eq(schema.users.roleId, 5),
        isNull(schema.users.password)
      )
    )
    .limit(1);

  return user ?? null;
}

export async function registerCoord(id: string, email: string, nik: string, passwordHash: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.id, id),
        eq(schema.users.roleId, 5),
        isNull(schema.users.password)
      )
    )
    .limit(1);

  if (!user) {
    throw new Error("NOT_FOUND");
  }

  const [conflictUser] = await db
    .select({ id: schema.users.id, email: schema.users.email, nik: schema.users.nik })
    .from(schema.users)
    .where(
      and(
        ne(schema.users.id, id),
        or(
          eq(schema.users.email, email),
          eq(schema.users.nik, nik)
        )
      )
    )
    .limit(1);

  if (conflictUser) {
    if (conflictUser.email === email) throw new Error("EMAIL_EXISTS");
    if (conflictUser.nik === nik) throw new Error("NIK_EXISTS");
  }

  await db
    .update(schema.users)
    .set({
      email: email,
      nik: nik,
      password: passwordHash,
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id));

  // Send notifications to RT (roleId: 2)
  try {
    const rts = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.roleId, 2));

    if (rts.length > 0) {
      const insertPromises = rts.map((rt) =>
        db.insert(schema.notifications).values({
          userId: rt.id,
          title: "Registrasi Koordinator Baru",
          message: `Koordinator bernama ${user.name} telah menyelesaikan pendaftaran koordinator kos. Silakan tinjau.`,
          category: "dinas",
          redirectLink: `/dashboard/approvals/registration`,
        })
      );
      await Promise.all(insertPromises);
    }
  } catch (notifErr) {
    console.error("Gagal mengirim notifikasi registrasi koordinator ke RT:", notifErr);
  }
}

export async function updateUserRole(userId: string, roleId: number) {
  return db
    .update(schema.users)
    .set({ roleId, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function updateUserStatus(userId: string, status: "pending" | "active" | "suspended") {
  return db
    .update(schema.users)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  return db
    .update(schema.users)
    .set({ password: passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}
