import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import {
  listCashTransactions,
  createCashTransaction,
  createExpenseSchema,
} from "@/db/queries/kas";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const currentRoleId = session.user.roleId;
    const isAllowed =
      currentRoleId === 1 ||
      currentRoleId === 2 ||
      currentRoleId === 4 ||
      (await hasPermission(currentRoleId, "view-finance"));

    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 10;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const result = await listCashTransactions({
      type: "expense",
      limit,
      offset,
      query,
      category,
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in GET /api/kas/expense:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const currentRoleId = session.user.roleId;
    const isAllowed =
      currentRoleId === 1 ||
      currentRoleId === 2 ||
      currentRoleId === 4 ||
      (await hasPermission(currentRoleId, "manage-expense"));

    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createExpenseSchema.parse(body);

    const insertedId = await createCashTransaction("expense", validated, session.user.id);

    return NextResponse.json(
      { message: "Pengeluaran kas berhasil dicatat", id: insertedId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    console.error("Error in POST /api/kas/expense:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
