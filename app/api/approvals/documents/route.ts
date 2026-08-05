import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getEffectiveRoleId, hasPermission } from "@/lib/rbac";
import { listFamilies } from "@/db/queries/population/family.queries";
import { listAllTenantContracts } from "@/db/queries/property/tenant.queries";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Belum terautentikasi" }, { status: 401 });
    }

    const effectiveRoleId = await getEffectiveRoleId(session);
    const isAllowed = await hasPermission(effectiveRoleId, "verify-documents");
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "family"; // 'family' atau 'rental_resident'
    const status = (searchParams.get("status") || "pending") as "pending" | "verified" | "rejected";
    const query = searchParams.get("query") || "";

    if (type === "family") {
      const result = await listFamilies({
        verificationStatus: status,
        query,
        isActive: true,
        limit: 100,
        offset: 0,
      });
      return NextResponse.json({ data: result.data || [] });
    } else if (type === "rental_resident") {
      const result = await listAllTenantContracts({
        query,
        isActive: true,
        limit: 100,
        offset: 0,
      });
      return NextResponse.json({ data: result.data || [] });
    } else {
      return NextResponse.json({ error: "Tipe dokumen tidak valid" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in GET /api/approvals/documents:", error);
    return NextResponse.json({ error: error.message || "Kesalahan server internal" }, { status: 500 });
  }
}
