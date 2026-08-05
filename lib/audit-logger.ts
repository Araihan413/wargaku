import { headers } from "next/headers";

/**
 * Utility helper untuk mengekstraksi IP address klien dari Next.js Server Context
 */
export async function getClientIp(req?: Request): Promise<string | null> {
  try {
    let rawIp: string | null = null;
    if (req) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      if (forwardedFor) {
        rawIp = forwardedFor.split(",")[0].trim();
      } else {
        const realIp = req.headers.get("x-real-ip");
        if (realIp) rawIp = realIp.trim();
      }
    }

    if (!rawIp) {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      if (forwardedFor) {
        rawIp = forwardedFor.split(",")[0].trim();
      } else {
        const realIp = headerList.get("x-real-ip");
        if (realIp) rawIp = realIp.trim();
      }
    }

    if (rawIp) {
      if (
        rawIp === "::1" ||
        rawIp.includes("0000:0000:0000:0000") ||
        rawIp === "::ffff:127.0.0.1"
      ) {
        return "127.0.0.1";
      }
      return rawIp;
    }
  } catch {
    // Fallback jika headers context tidak tersedia
  }
  return "127.0.0.1";
}

