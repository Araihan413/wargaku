import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql, or, and } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { sendEmail } from "@/lib/mail";
import { getCoordWelcomeWithPasswordEmail } from "@/lib/emails/templates";
import { z } from "zod";

// ==========================================
// COORDINATORS QUERIES
// ==========================================

export const createCoordinatorSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid").max(100),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  phone: z.string().min(10, "Nomor HP minimal 10 digit").max(15).optional().nullable(),
  existingUserId: z.string().optional().nullable(),
});

export type CreateCoordinatorInput = z.infer<typeof createCoordinatorSchema>;

/**
 * Mengambil daftar koordinator (user dengan roleId = 5).
 */
export async function listCoordinators() {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      nik: schema.users.nik,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
      propertiesCount: sql<number>`(
        SELECT COUNT(*) 
        FROM ${schema.rentalProperties} rp 
        WHERE rp.coordinator_user_id = ${schema.users.id}
          AND rp.is_active = true
      )`.mapWith(Number),
    })
    .from(schema.users)
    .where(eq(schema.users.roleId, 5))
    .orderBy(schema.users.name);
}

/**
 * Membuat/mempromosikan koordinator kos baru.
 */
export async function createCoordinator(data: CreateCoordinatorInput) {
  const validated = createCoordinatorSchema.parse(data);

  let targetUserId = validated.existingUserId;
  let isNewUserCreated = false;
  let generatedPassword = "";
  let emailSentSuccessfully = false;

  if (targetUserId) {
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, targetUserId))
      .limit(1);

    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    await db
      .update(schema.users)
      .set({
        roleId: 5,
        status: "active",
        phone: validated.phone || existingUser.phone,
      })
      .where(eq(schema.users.id, targetUserId));
  } else {
    const [existingAccount] = await db
      .select()
      .from(schema.users)
      .where(or(eq(schema.users.email, validated.email), eq(schema.users.nik, validated.nik)))
      .limit(1);

    if (existingAccount) {
      targetUserId = existingAccount.id;
      await db
        .update(schema.users)
        .set({
          roleId: 5,
          status: "active",
          phone: validated.phone || existingAccount.phone,
        })
        .where(eq(schema.users.id, targetUserId));
    } else {
      targetUserId = crypto.randomUUID();
      isNewUserCreated = true;

      generatedPassword = Math.random().toString(36).substring(2, 10);
      const hashedPassword = await hashPassword(generatedPassword);

      await db.insert(schema.users).values({
        id: targetUserId,
        name: validated.name,
        email: validated.email,
        nik: validated.nik,
        phone: validated.phone || null,
        roleId: 5,
        status: "active",
      });

      await db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        accountId: validated.email,
        providerId: "credential",
        userId: targetUserId,
        password: hashedPassword,
      });

      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const loginLink = `${appUrl}/login`;

        await sendEmail({
          to: { email: validated.email, name: validated.name },
          subject: "Aktivasi Akun Koordinator Kos - Wargaku",
          htmlContent: getCoordWelcomeWithPasswordEmail(
            validated.name,
            validated.email,
            generatedPassword,
            loginLink
          ),
        });
        emailSentSuccessfully = true;
      } catch (emailErr) {
        console.error("Gagal mengirim email kredensial:", emailErr);
        emailSentSuccessfully = false;
      }
    }
  }

  return {
    targetUserId,
    isNewUserCreated,
    generatedPassword: generatedPassword || null,
    emailSentSuccessfully,
  };
}

/**
 * Menangguhkan akun koordinator dan mengalihkan properti ke pemilik hunian.
 */
export async function suspendCoordinator(coordinatorId: string) {
  const managedProperties = await db
    .select({
      id: schema.rentalProperties.id,
      ownerUserId: schema.dwellings.ownerUserId,
    })
    .from(schema.rentalProperties)
    .innerJoin(schema.dwellings, eq(schema.rentalProperties.dwellingId, schema.dwellings.id))
    .where(
      and(
        eq(schema.rentalProperties.coordinatorUserId, coordinatorId),
        eq(schema.rentalProperties.isActive, true)
      )
    );

  for (const prop of managedProperties) {
    await db
      .update(schema.rentalProperties)
      .set({
        coordinatorUserId: prop.ownerUserId || null,
      })
      .where(eq(schema.rentalProperties.id, prop.id));
  }

  await db
    .update(schema.users)
    .set({
      status: "suspended",
    })
    .where(eq(schema.users.id, coordinatorId));

  return managedProperties.length;
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

  const newUserId = crypto.randomUUID();
  const tempEmail = `pending-${cleanPhone}-${Math.random().toString(36).substring(2, 7)}@wargaku.temp`;

  await db.insert(schema.users).values({
    id: newUserId,
    name,
    email: tempEmail,
    phone: cleanPhone,
    roleId: 5,
    status: "pending",
    emailVerified: false,
  });

  return newUserId;
}

/**
 * Mengambil detail koordinator berdasarkan ID.
 */
export async function getCoordinatorById(coordinatorId: string) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
    })
    .from(schema.users)
    .where(eq(schema.users.id, coordinatorId))
    .limit(1);

  return user || null;
}

