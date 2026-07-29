import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWargaDashboard } from "@/db/queries/dashboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getWargaDashboard(session.user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching warga dashboard:", error);
    return NextResponse.json(
      { error: "Gagal memuat data dashboard warga" },
      { status: 500 }
    );
  }
}
