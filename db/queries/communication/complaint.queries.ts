import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, count, desc, like, or, gte, sql } from "drizzle-orm";

export interface ListComplaintsOptions {
  status?: string | null;
  category?: string | null;
  search?: string | null;
}

export interface CreateComplaintInput {
  reporterName: string;
  reporterPhone?: string | null;
  category: "Infrastruktur" | "Kebersihan" | "Keamanan" | "Sosial" | "Lainnya";
  description: string;
  photoPath?: string | null;
  dwellingId?: number | null;
  ipAddress?: string | null;
}

export async function checkIpRateLimit(ipAddress: string | null): Promise<boolean> {
  if (!ipAddress) return true;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [res] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(
      and(
        eq(schema.complaints.ipAddress, ipAddress),
        gte(schema.complaints.createdAt, oneHourAgo)
      )
    );

  const complaintCount = res?.count || 0;
  return complaintCount < 4;
}

export interface UpdateComplaintInput {
  status?: "menunggu" | "proses" | "selesai" | "ditolak";
  responseNote?: string | null;
}

export async function listComplaints(options: ListComplaintsOptions = {}) {
  const { status, category, search } = options;

  const [totalRes] = await db.select({ count: count() }).from(schema.complaints);
  const [pendingRes] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, "menunggu"));
  const [processRes] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, "proses"));
  const [completedRes] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, "selesai"));
  const [rejectedRes] = await db
    .select({ count: count() })
    .from(schema.complaints)
    .where(eq(schema.complaints.status, "ditolak"));

  const stats = {
    total: totalRes?.count || 0,
    menunggu: pendingRes?.count || 0,
    proses: processRes?.count || 0,
    selesai: completedRes?.count || 0,
    ditolak: rejectedRes?.count || 0,
  };

  const conditions = [];

  if (status && status !== "all") {
    conditions.push(
      eq(
        schema.complaints.status,
        status as "menunggu" | "proses" | "selesai" | "ditolak"
      )
    );
  }

  if (category && category !== "all") {
    conditions.push(
      eq(
        schema.complaints.category,
        category as "Infrastruktur" | "Kebersihan" | "Keamanan" | "Sosial" | "Lainnya"
      )
    );
  }

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        like(schema.complaints.trackingCode, searchPattern),
        like(schema.complaints.reporterName, searchPattern),
        like(schema.complaints.reporterPhone, searchPattern),
        like(schema.complaints.description, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rawList = await db
    .select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      reporterPhone: schema.complaints.reporterPhone,
      category: schema.complaints.category,
      description: schema.complaints.description,
      photoPath: schema.complaints.photoPath,
      dwellingId: schema.complaints.dwellingId,
      status: schema.complaints.status,
      responseNote: schema.complaints.responseNote,
      handledBy: schema.complaints.handledBy,
      createdAt: schema.complaints.createdAt,
      resolvedAt: schema.complaints.resolvedAt,
      handlerName: schema.users.name,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
    })
    .from(schema.complaints)
    .leftJoin(schema.users, eq(schema.complaints.handledBy, schema.users.id))
    .leftJoin(schema.dwellings, eq(schema.complaints.dwellingId, schema.dwellings.id))
    .where(whereClause)
    .orderBy(desc(schema.complaints.createdAt));

  const complaintsList = rawList.map((c) => {
    const dwellingAddress =
      c.blockNumber || c.houseNumber
        ? `Blok ${c.blockNumber || "-"} No. ${c.houseNumber || "-"}`
        : null;

    return {
      id: c.id,
      trackingCode: c.trackingCode,
      reporterName: c.reporterName,
      reporterPhone: c.reporterPhone,
      category: c.category,
      description: c.description,
      photoPath: c.photoPath,
      dwellingId: c.dwellingId,
      status: c.status,
      responseNote: c.responseNote,
      handledBy: c.handledBy,
      handlerName: c.handlerName,
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      dwellingAddress,
    };
  });

  return {
    stats,
    data: complaintsList,
  };
}

export async function createComplaint(input: CreateComplaintInput) {
  const currentYear = new Date().getFullYear();
  const prefix = `LAP-${currentYear}-`;

  const [latestRecord] = await db
    .select({ trackingCode: schema.complaints.trackingCode })
    .from(schema.complaints)
    .where(like(schema.complaints.trackingCode, `${prefix}%`))
    .orderBy(desc(schema.complaints.id))
    .limit(1);

  let nextNumber = 1;
  if (latestRecord?.trackingCode) {
    const parts = latestRecord.trackingCode.split("-");
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }
  }

  const trackingCode = `${prefix}${String(nextNumber).padStart(3, "0")}`;

  const [insertedResult] = await db.insert(schema.complaints).values({
    trackingCode,
    reporterName: input.reporterName.trim(),
    reporterPhone: input.reporterPhone ? input.reporterPhone.trim() : null,
    category: input.category,
    description: input.description.trim(),
    photoPath: input.photoPath || null,
    dwellingId: input.dwellingId ? Number(input.dwellingId) : null,
    ipAddress: input.ipAddress || null,
    status: "menunggu",
  });

  return {
    id: insertedResult.insertId,
    trackingCode,
  };
}

export async function getComplaintById(id: number) {
  const [c] = await db
    .select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      reporterPhone: schema.complaints.reporterPhone,
      category: schema.complaints.category,
      description: schema.complaints.description,
      photoPath: schema.complaints.photoPath,
      dwellingId: schema.complaints.dwellingId,
      status: schema.complaints.status,
      responseNote: schema.complaints.responseNote,
      handledBy: schema.complaints.handledBy,
      createdAt: schema.complaints.createdAt,
      resolvedAt: schema.complaints.resolvedAt,
      handlerName: schema.users.name,
    })
    .from(schema.complaints)
    .leftJoin(schema.users, eq(schema.complaints.handledBy, schema.users.id))
    .where(eq(schema.complaints.id, id));

  if (!c) return null;

  let dwellingAddress: string | null = null;
  if (c.dwellingId) {
    const [dw] = await db
      .select()
      .from(schema.dwellings)
      .where(eq(schema.dwellings.id, c.dwellingId));
    if (dw) {
      dwellingAddress = `Blok ${dw.blockNumber || "-"} No. ${dw.houseNumber || "-"}`;
    }
  }

  return {
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    dwellingAddress,
  };
}

export async function getComplaintByTrackingCode(trackingCode: string) {
  const [c] = await db
    .select({
      id: schema.complaints.id,
      trackingCode: schema.complaints.trackingCode,
      reporterName: schema.complaints.reporterName,
      category: schema.complaints.category,
      description: schema.complaints.description,
      photoPath: schema.complaints.photoPath,
      status: schema.complaints.status,
      responseNote: schema.complaints.responseNote,
      createdAt: schema.complaints.createdAt,
      resolvedAt: schema.complaints.resolvedAt,
      handlerName: schema.users.name,
    })
    .from(schema.complaints)
    .leftJoin(schema.users, eq(schema.complaints.handledBy, schema.users.id))
    .where(eq(schema.complaints.trackingCode, trackingCode));

  if (!c) return null;

  return {
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
  };
}

export async function updateComplaintStatus(
  id: number,
  input: UpdateComplaintInput,
  handlerUserId: string
) {
  const [existing] = await db
    .select()
    .from(schema.complaints)
    .where(eq(schema.complaints.id, id));

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const updatePayload: Record<string, any> = {};

  if (input.status) {
    updatePayload.status = input.status;
    updatePayload.handledBy = handlerUserId;

    if (input.status === "selesai" || input.status === "ditolak") {
      updatePayload.resolvedAt = new Date();
    }
  }

  if (input.responseNote !== undefined) {
    updatePayload.responseNote = input.responseNote ? input.responseNote.trim() : null;
  }

  await db
    .update(schema.complaints)
    .set(updatePayload)
    .where(eq(schema.complaints.id, id));
}

export async function deleteComplaint(id: number) {
  const [existing] = await db
    .select()
    .from(schema.complaints)
    .where(eq(schema.complaints.id, id));

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  await db.delete(schema.complaints).where(eq(schema.complaints.id, id));
}
