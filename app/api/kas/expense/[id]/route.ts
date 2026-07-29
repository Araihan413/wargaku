import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import {
  updateCashTransaction,
  deleteCashTransaction,
  updateExpenseSchema,
} from "@/db/queries/kas";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
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

    const resolvedParams = await params;
    const expenseId = Number(resolvedParams.id);

    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    await updateCashTransaction(expenseId, "expense", validated);

    return NextResponse.json({ message: "Data pengeluaran berhasil diperbarui" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Data pengeluaran tidak ditemukan" }, { status: 404 });
    }
    console.error("Error in PUT /api/kas/expense/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const resolvedParams = await params;
    const expenseId = Number(resolvedParams.id);

    await deleteCashTransaction(expenseId, "expense");

    return NextResponse.json({ message: "Data pengeluaran berhasil dihapus" });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Data pengeluaran tidak ditemukan" }, { status: 404 });
    }
    console.error("Error in DELETE /api/kas/expense/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
