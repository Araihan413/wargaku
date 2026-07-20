import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { updateUserRole, updateUserStatus } from "@/db/queries/users";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import 'dotenv/config';
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { updateUserSchema } from "@/lib/validations/user";
import { ZodError } from "zod";

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

    const allowed = await hasPermission(session.user.roleId, "manage-users");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    if (action === "update_profile") {
      const validatedData = updateUserSchema.parse(payload);

      // Fetch target user info
      const targetUser = await db
        .select({ roleId: schema.users.roleId })
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      const targetRoleId = targetUser[0]?.roleId;

      // [S-01] Self-protection: block changing own roleId
      if (id === session.user.id && validatedData.roleId !== session.user.roleId) {
        return NextResponse.json(
          { error: "Anda tidak dapat mengubah peran akun Anda sendiri" },
          { status: 403 }
        );
      }

      // [S-02] Mutual SA protection: block editing another SA's profile entirely
      if (targetRoleId === 1 && id !== session.user.id) {
        return NextResponse.json(
          { error: "Profil akun Super Admin lain tidak dapat diubah" },
          { status: 403 }
        );
      }

      // [S-03] Cannot promote anyone to Super Admin via profile update (must use Add User instead)
      if (validatedData.roleId === 1 && targetRoleId !== 1) {
        return NextResponse.json(
          { error: "Mutasi ke peran Super Admin tidak diizinkan melalui pembaruan profil" },
          { status: 400 }
        );
      }

      // Check NIK duplicate (excluding this user)
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
          return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
        }
      }

      // Check Email duplicate (excluding this user)
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
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
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
          return NextResponse.json(
            { error: `Akun untuk posisi ${officerRoleName} yang aktif/pending sudah ada (${existingOfficer[0].name})` },
            { status: 400 }
          );
        }
      }

      // Update both profile and Better Auth account email in a transaction
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

        // Sync Better Auth account email
        await tx
          .update(schema.accounts)
          .set({ accountId: validatedData.email })
          .where(eq(schema.accounts.userId, id));
      });

      return NextResponse.json({ success: true, message: "Profil pengguna berhasil diperbarui" });
    }

    if (action === "mutate_role") {
      const { roleId } = payload;
      if (typeof roleId !== "number") {
        return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
      }

      // Fetch target user info
      const targetUserForMutate = await db
        .select({ roleId: schema.users.roleId })
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      const targetRoleIdForMutate = targetUserForMutate[0]?.roleId;

      // [S-01] Self-protection: cannot mutate own role
      if (id === session.user.id) {
        return NextResponse.json(
          { error: "Anda tidak dapat mengubah peran akun Anda sendiri" },
          { status: 403 }
        );
      }

      // [S-02] Mutual SA protection: cannot mutate another SA's role
      if (targetRoleIdForMutate === 1) {
        return NextResponse.json(
          { error: "Peran akun Super Admin lain tidak dapat diubah" },
          { status: 403 }
        );
      }

      // [S-03] Cannot mutate any user to Super Admin (SA must be created from scratch)
      if (roleId === 1) {
        return NextResponse.json(
          { error: "Peran Super Admin tidak dapat diberikan melalui mutasi peran" },
          { status: 400 }
        );
      }

      // Check if trying to mutate to an RT officer role (2, 3, or 4) and it already exists active
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
          return NextResponse.json(
            { error: `Akun untuk posisi ${officerRoleName} yang aktif/pending sudah ada (${existingOfficer[0].name})` },
            { status: 400 }
          );
        }
      }

      await updateUserRole(id, roleId);
      return NextResponse.json({ success: true, message: "Peran berhasil dimutasi" });
    }

    if (action === "suspend_toggle") {
      const { status } = payload;
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      // [S-01] Self-protection: cannot suspend/activate own account
      if (id === session.user.id) {
        return NextResponse.json(
          { error: "Anda tidak dapat menangguhkan atau mengaktifkan akun Anda sendiri" },
          { status: 403 }
        );
      }

      // Fetch target user info for SA protection
      const targetUserForSuspend = await db
        .select({ roleId: schema.users.roleId })
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      // [S-02] Mutual SA protection: cannot suspend/activate another SA
      if (targetUserForSuspend[0]?.roleId === 1) {
        return NextResponse.json(
          { error: "Status akun Super Admin lain tidak dapat diubah" },
          { status: 403 }
        );
      }

      // If unsuspending/activating, check limits
      if (status === "active" && targetUserForSuspend.length > 0) {
        const targetRoleId = targetUserForSuspend[0].roleId;

        // [S-03] Limit active/pending Super Admins to max 2 when activating
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
            return NextResponse.json(
              { error: "Batas maksimum 2 akun Super Admin aktif/pending telah tercapai" },
              { status: 400 }
            );
          }
        }

        // Check if target is an RT officer and another active officer already exists
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
            return NextResponse.json(
              { error: `Tidak dapat mengaktifkan akun. Posisi ${officerRoleName} yang aktif sudah diisi oleh (${existingOfficer[0].name})` },
              { status: 400 }
            );
          }
        }
      }

      await updateUserStatus(id, status);
      return NextResponse.json({
        success: true,
        message: status === "suspended" ? "Akun berhasil ditangguhkan" : "Akun berhasil diaktifkan",
      });
    }

    if (action === "reset_password") {
      const defaultPassword = process.env.DEFAULT_PASSWORD!;
      
      if (!defaultPassword) {
        return NextResponse.json({ error: "Password default tidak ditemukan" }, { status: 500 });
      }
      const hashedPassword = await hashPassword(defaultPassword);

      // Update both user and credentials account in a transaction (with self-healing for old missing accounts)
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
          // Self-healing: Create the missing account entry
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

      return NextResponse.json({
        success: true,
        message: `Password berhasil di-reset menjadi ${defaultPassword}`,
        defaultPassword,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
