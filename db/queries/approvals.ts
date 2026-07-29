import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { sendEmail } from "@/lib/mail";
import {
  getWargaApprovalEmail,
  getCoordActivationEmail,
  getRegistrationRejectionEmail,
} from "@/lib/emails/templates";

// ==========================================
// APPROVALS QUERIES
// ==========================================

/**
 * Mengambil daftar pendaftaran akun yang berstatus pending (role Warga & Koordinator Kos).
 */
export async function listPendingRegistrations() {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      nik: schema.users.nik,
      phone: schema.users.phone,
      roleId: schema.users.roleId,
      familyNumber: schema.users.familyNumber,
      unitNumber: schema.users.unitNumber,
      createdAt: schema.users.createdAt,
      dwellingId: schema.users.dwellingId,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.users)
    .leftJoin(schema.dwellings, eq(schema.users.dwellingId, schema.dwellings.id))
    .where(
      and(
        eq(schema.users.status, "pending"),
        inArray(schema.users.roleId, [5, 6])
      )
    )
    .orderBy(desc(schema.users.createdAt));
}

/**
 * Memproses persetujuan atau penolakan registrasi akun user.
 */
export async function processRegistrationApproval(
  userId: string,
  action: "approve" | "reject",
  rejectReason?: string,
  requestOrigin?: string
) {
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      nik: schema.users.nik,
      phone: schema.users.phone,
      roleId: schema.users.roleId,
      status: schema.users.status,
      familyNumber: schema.users.familyNumber,
      dwellingId: schema.users.dwellingId,
      unitNumber: schema.users.unitNumber,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.status !== "pending") {
    throw new Error("NOT_PENDING");
  }

  if (action === "approve") {
    await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(schema.users.id, userId));

      if (user.roleId === 6) {
        const [existingFamily] = await tx
          .select({ id: schema.families.id })
          .from(schema.families)
          .where(eq(schema.families.headUserId, userId))
          .limit(1);

        if (!existingFamily) {
          const targetDwellingId = user.dwellingId;

          if (targetDwellingId && user.familyNumber && user.nik) {
            const [insertFamily] = await tx.insert(schema.families).values({
              dwellingId: targetDwellingId,
              familyNumber: user.familyNumber,
              headUserId: userId,
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
              userId,
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
    });

    const origin = requestOrigin || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

    if (user.roleId === 5) {
      const activationLink = `${origin}/auth/reset-password?token=activation-${userId}`;
      try {
        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: "Akun Koordinator Kost Anda Telah Aktif",
          htmlContent: getCoordActivationEmail(user.name, activationLink),
        });
      } catch (mailErr) {
        console.error("Gagal mengirim email aktivasi ke koordinator:", mailErr);
      }
    } else if (user.roleId === 6) {
      const loginLink = `${origin}/login`;
      try {
        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: "Akun Wargaku Anda Telah Aktif",
          htmlContent: getWargaApprovalEmail(user.name, loginLink),
        });
      } catch (mailErr) {
        console.error("Gagal mengirim email aktivasi ke warga:", mailErr);
      }
    }
  } else {
    try {
      await sendEmail({
        to: { email: user.email, name: user.name },
        subject: "Pendaftaran Akun Wargaku Ditolak",
        htmlContent: getRegistrationRejectionEmail(user.name, rejectReason || ""),
      });
    } catch (mailErr) {
      console.error("Gagal mengirim email penolakan registrasi ke warga:", mailErr);
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.rentalProperties)
        .set({ coordinatorUserId: null })
        .where(eq(schema.rentalProperties.coordinatorUserId, userId));

      await tx.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
      await tx.delete(schema.users).where(eq(schema.users.id, userId));
    });
  }
}
