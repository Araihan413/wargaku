import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSystemSettings } from "./system-settings";

export interface DwellingOption {
  id: number;
  blockNumber: string;
  houseNumber: string;
  qrToken: string;
  type: string;
  familyHeadName?: string | null;
}

export async function getQrCodePageData() {
  const systemSettings = await getSystemSettings();

  // Fetch list of dwellings
  const dwellingsRaw = await db
    .select({
      id: schema.dwellings.id,
      blockNumber: schema.dwellings.blockNumber,
      houseNumber: schema.dwellings.houseNumber,
      qrToken: schema.dwellings.qrToken,
      type: schema.dwellings.type,
      familyHeadName: schema.families.headName,
    })
    .from(schema.dwellings)
    .leftJoin(schema.families, eq(schema.dwellings.id, schema.families.dwellingId))
    .orderBy(schema.dwellings.blockNumber, schema.dwellings.houseNumber)
    .limit(100);

  // Deduplicate by dwelling ID
  const map = new Map<number, DwellingOption>();
  for (const d of dwellingsRaw) {
    if (!map.has(d.id)) {
      map.set(d.id, {
        id: d.id,
        blockNumber: d.blockNumber,
        houseNumber: d.houseNumber,
        qrToken: d.qrToken,
        type: d.type,
        familyHeadName: d.familyHeadName || null,
      });
    }
  }

  const dwellings = Array.from(map.values());

  return {
    systemSettings,
    dwellings,
  };
}
