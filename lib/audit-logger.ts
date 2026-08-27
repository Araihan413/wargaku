import { headers } from "next/headers";

/**
 * Utility helper untuk mengekstraksi IP address klien dari Next.js Server Context
 */
export async function getClientIp(req?: Request): Promise<string | null> {
  try {
    const headerList = !req ? await headers().catch(() => null) : null;
    const getHdr = (key: string) => req?.headers.get(key) || headerList?.get(key) || null;

    const rawIp =
      getHdr("cf-connecting-ip")?.trim() ||
      getHdr("x-forwarded-for")?.split(",")[0]?.trim() ||
      getHdr("x-real-ip")?.trim() ||
      null;

    if (rawIp) {
      if (rawIp === "::1" || rawIp.includes("0000:0000:0000:0000") || rawIp === "::ffff:127.0.0.1") {
        return "127.0.0.1";
      }
      return rawIp;
    }
  } catch {
    // Fallback jika context headers tidak tersedia
  }
  return "127.0.0.1";
}

