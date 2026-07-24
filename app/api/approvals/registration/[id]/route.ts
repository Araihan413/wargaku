import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/mail";
import { getWargaApprovalEmail, getCoordActivationEmail, getRegistrationRejectionEmail } from "@/lib/emails/templates";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAllowed = await hasPermission(session.user.roleId, "verify-registrations");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectReason } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Aksi tidak valid (harus approve atau reject)" }, { status: 400 });
    }

    // Fetch target user
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
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.status !== "pending") {
      return NextResponse.json({ error: "Akun ini tidak dalam status pending persetujuan" }, { status: 400 });
    }

    if (action === "approve") {
      await db.transaction(async (tx) => {
        // 1. Update status ke active
        await tx
          .update(schema.users)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(schema.users.id, id));

        // 2. Buat Kartu Keluarga & Anggota KK Kepala Keluarga secara transaksional
        if (user.roleId === 6) { // Warga
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
                verificationStatus: "draft", // KK mulai dari status draf sebelum diupload berkas fisiknya
                checkInDate: new Date(),
                isActive: true,
              });

              const familyId = insertFamily.insertId;

              // Masukkan sebagai Kepala Keluarga pertama di familyMembers
              await tx.insert(schema.familyMembers).values({
                familyId,
                name: user.name,
                nik: user.nik,
                relationship: "Kepala_Keluarga",
                gender: "L", // default L
                phone: user.phone || null,
                isActive: true,
              });
            }
          }
        }
      });

      if (user.roleId === 5) {
        const origin = request.headers.get("origin") || process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const activationLink = `${origin}/auth/reset-password?token=activation-${id}`;

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
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
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

      return NextResponse.json({ success: true, message: "Pendaftaran berhasil disetujui" });
    } else {
      // action === "reject"
      try {
        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: "Pendaftaran Akun Wargaku Ditolak",
          htmlContent: getRegistrationRejectionEmail(user.name, rejectReason || ""),
        });
      } catch (mailErr) {
        console.error("Gagal mengirim email penolakan registrasi ke warga:", mailErr);
      }

      // 2. Hapus data referensi terlebih dahulu untuk menghindari Foreign Key constraint violation, lalu hapus data user utama
      await db.transaction(async (tx) => {
        // Set coordinatorUserId ke null pada properti sewa yang menunjuk user ini
        await tx
          .update(schema.rentalProperties)
          .set({ coordinatorUserId: null })
          .where(eq(schema.rentalProperties.coordinatorUserId, id));

        // Hapus akun & sesi terkait better-auth
        await tx.delete(schema.accounts).where(eq(schema.accounts.userId, id));
        await tx.delete(schema.sessions).where(eq(schema.sessions.userId, id));

        // Hapus user utama
        await tx.delete(schema.users).where(eq(schema.users.id, id));
      });

      return NextResponse.json({ success: true, message: "Pendaftaran warga berhasil ditolak & email penolakan terkirim" });
    }
  } catch (error: any) {
    console.error("Error in PATCH /api/approvals/registration/[id]:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
