import { NextResponse } from "next/server";
import { createAuditLog } from '@/db/queries/system/audit-log.queries';
import { getClientIp } from "@/lib/audit-logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, reason } = body;

    if (!email) {
      return NextResponse.json({ error: "Email/NIK wajib diisi" }, { status: 400 });
    }

    const ipAddress = await getClientIp(request);
    await createAuditLog({
      action: "LOGIN_FAILED",
      module: "auth",
      description: `Percobaan login gagal untuk identifier "${email}" (Alasan: ${reason || "Password/Kredensial Salah"})`,
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Gagal mencatat log failed login:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
