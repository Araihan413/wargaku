import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { listUsers, listRoles } from "@/db/queries/users";
import { createUserSchema } from "@/lib/validations/user";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { ZodError } from "zod";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = 
      await hasPermission(session.user.roleId, "manage-users") ||
      await hasPermission(session.user.roleId, "manage-residents") ||
      await hasPermission(session.user.roleId, "view-residents");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;
    const roleId = searchParams.get("roleId") ? parseInt(searchParams.get("roleId")!, 10) : undefined;
    const status = searchParams.get("status") as "pending" | "active" | "suspended" | null || undefined;
    const query = searchParams.get("query") || undefined;
    const withoutFamily = searchParams.get("withoutFamily") === "true";
    const excludeExceptId = searchParams.get("excludeExceptId") || undefined;

    const usersData = await listUsers({ limit, offset, roleId, status, query, withoutFamily, excludeExceptId });
    const rolesData = await listRoles();

    return NextResponse.json({
      users: usersData.data,
      metadata: usersData.metadata,
      roles: rolesData,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const allowed = 
      await hasPermission(session.user.roleId, "manage-users") ||
      (await hasPermission(session.user.roleId, "manage-residents") && validatedData.roleId === 6);
      
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if email already exists
    const existingUserByEmail = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email))
      .limit(1);

    if (existingUserByEmail.length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    // Check if NIK already exists
    if (validatedData.nik) {
      const existingUserByNik = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.nik, validatedData.nik))
        .limit(1);

      if (existingUserByNik.length > 0) {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
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
        return NextResponse.json(
          { error: `Akun untuk posisi ${officerRoleName} yang aktif/pending sudah ada (${existingOfficer[0].name})` },
          { status: 400 }
        );
      }
    }

    // [S-03] Check Super Admin count limit (max 2 active/pending)
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
        return NextResponse.json(
          { error: "Batas maksimum 2 akun Super Admin aktif/pending telah tercapai" },
          { status: 400 }
        );
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
            verificationStatus: "verified", // Directly verified since RT/Admin created it
            hasVerified: true,
            lastVerifiedAt: new Date(),
            checkInDate: new Date(),
            isActive: true,
          });

          const familyId = insertFamily.insertId;

          // Add Head of Family to familyMembers table
          await tx.insert(schema.familyMembers).values({
            familyId,
            name: validatedData.name,
            nik: validatedData.nik,
            relationship: "Kepala_Keluarga",
            gender: validatedData.gender || "L",
            phone: validatedData.phone || null,
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

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        nik: newUser.nik,
        phone: newUser.phone,
        roleId: newUser.roleId,
        status: newUser.status,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
