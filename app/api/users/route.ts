import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import { listUsers, listRoles, createUserWithAccount } from "@/db/queries/users";
import { createUserSchema } from "@/lib/validations/user";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = 
      Boolean(session.user) ||
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

    const newUser = await createUserWithAccount(validatedData);

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
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validasi gagal" }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS") {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
      if (error.message === "NIK_EXISTS") {
        return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
      }
      if (error.message.startsWith("OFFICER_EXISTS:")) {
        const parts = error.message.split(":");
        return NextResponse.json(
          { error: `Akun untuk posisi ${parts[1]} yang aktif/pending sudah ada (${parts[2]})` },
          { status: 400 }
        );
      }
      if (error.message === "SUPERADMIN_LIMIT_REACHED") {
        return NextResponse.json(
          { error: "Batas maksimum 2 akun Super Admin aktif/pending telah tercapai" },
          { status: 400 }
        );
      }
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
