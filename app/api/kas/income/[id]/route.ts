import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";
import {
  updateCashTransaction,
  deleteCashTransaction,
  updateIncomeSchema,
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
      (await hasPermission(currentRoleId, "manage-income"));

    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const resolvedParams = await params;
    const incomeId = Number(resolvedParams.id);

    const body = await request.json();
    const validated = updateIncomeSchema.parse(body);

    await updateCashTransaction(incomeId, "income", validated);

    return NextResponse.json({ message: "Data pemasukan berhasil diperbarui" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Data pemasukan tidak ditemukan" }, { status: 404 });
    }
    console.error("Error in PUT /api/kas/income/[id]:", error);
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
      (await hasPermission(currentRoleId, "manage-income"));

    if (!isAllowed) {
      return NextResponse.json({ error: "Tidak memiliki izin akses" }, { status: 403 });
    }

    const resolvedParams = await params;
    const incomeId = Number(resolvedParams.id);

    await deleteCashTransaction(incomeId, "income");

    return NextResponse.json({ message: "Data pemasukan berhasil dihapus" });
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Data pemasukan tidak ditemukan" }, { status: 404 });
    }
    console.error("Error in DELETE /api/kas/income/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
