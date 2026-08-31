/**
 * Utilities for consistent date and time formatting across the application.
 */

// Centralized Application Timezone (Single Source of Truth)
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Jakarta";

export function getTimezoneLabel(tz = APP_TIMEZONE): string {
  if (tz === "Asia/Makassar") return "WITA";
  if (tz === "Asia/Jayapura") return "WIT";
  return "WIB";
}

export const APP_TIMEZONE_LABEL = getTimezoneLabel(APP_TIMEZONE);

/**
 * Safely parses any date string or Date object into a valid Date.
 * Handles MySQL timestamp timezone serialization quirks (where local MySQL timestamps
 * are serialized with 'Z' as if they were UTC, causing a +7h future shift).
 */
export function parseToDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    const rawStr = String(dateInput).trim();
    if (!rawStr) return null;

    let d = new Date(rawStr);
    if (isNaN(d.getTime())) return null;

    // Detect future shift quirk: if date is > 1 hour in the future and ends with 'Z'
    // It means local database time was incorrectly suffixed with 'Z'
    const now = Date.now();
    if (d.getTime() - now > 60 * 60 * 1000 && rawStr.endsWith("Z")) {
      const localStr = rawStr.slice(0, -1);
      const localDate = new Date(localStr);
      if (!isNaN(localDate.getTime())) {
        d = localDate;
      }
    }

    return d;
  } catch {
    return null;
  }
}

/**
 * Format any date string or Date object into a human-readable relative time string in Indonesian.
 */
export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!dateInput) return fallback;
  try {
    const past = parseToDate(dateInput);
    if (!past) return fallback;

    const now = new Date();
    const diffMs = now.getTime() - past.getTime();

    // If less than 1 minute ago (or within 1 minute of now)
    if (diffMs < 60 * 1000) {
      if (diffMs < -60 * 1000) {
        // Future date relative representation
        const futureMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
        const futureHours = Math.floor(futureMins / 60);
        const futureDays = Math.floor(futureHours / 24);
        if (futureDays > 0) return `${futureDays} hari lagi`;
        if (futureHours > 0) return `${futureHours} jam lagi`;
        return `${futureMins} menit lagi`;
      }
      return "Baru saja";
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 30) return `${diffDays} hari lalu`;

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: past.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      timeZone: APP_TIMEZONE,
    }).format(past);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date object/string for HTML <input type="datetime-local">.
 */
export function formatToDatetimeLocal(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats various date input types into a strict "YYYY-MM-DD" string for HTML <input type="date"> elements.
 */
export function formatDateForInput(dateInput?: string | Date | number | unknown | null): string {
  if (!dateInput) return "";
  try {
    const toYmd = (d: Date) =>
      !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "";

    if (typeof dateInput === "number" || dateInput instanceof Date) {
      return toYmd(new Date(dateInput));
    }

    if (typeof dateInput === "string") {
      const trimmed = dateInput.trim();
      if (!trimmed) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

      const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;

      const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;

      return toYmd(new Date(trimmed));
    }
  } catch {
    return "";
  }
  return "";
}

/**
 * Alias for formatDateForInput for backwards compatibility.
 */
export const formatToHtmlDate = formatDateForInput;

/**
 * Calculates age in full years from a birth date accurately.
 */
export function calculateAge(birthDateInput?: string | Date | number | unknown | null): number {
  if (!birthDateInput) return 0;
  try {
    const formatted = formatDateForInput(birthDateInput);
    if (!formatted) return 0;
    const birth = new Date(formatted);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

/**
 * Formats a date object/string in Indonesian locale using centralized application timezone.
 */
export function formatLocalDate(
  dateInput?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
  fallback = "-"
): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat("id-ID", {
      timeZone: APP_TIMEZONE,
      ...options,
    }).format(d);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date into simple Indonesian date string (e.g., "31 Agustus 2026" or "Senin, 31 Agustus 2026").
 */
export function formatDate(
  dateInput?: string | Date | null,
  includeWeekday = false,
  fallback = "-"
): string {
  return formatLocalDate(
    dateInput,
    {
      weekday: includeWeekday ? "long" : undefined,
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    fallback
  );
}

/**
 * Formats a time into Indonesian time with timezone suffix (e.g., "11.21 WIB").
 */
export function formatTime(
  dateInput?: string | Date | null,
  includeTzSuffix = true,
  fallback = ""
): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    const formatted = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: APP_TIMEZONE,
    }).format(d);

    const timeClean = formatted.replace(":", ".");
    return includeTzSuffix ? `${timeClean} ${APP_TIMEZONE_LABEL}` : timeClean;
  } catch {
    return fallback;
  }
}

/**
 * Checks if record was updated after creation (at least 30 seconds difference).
 */
export function isEdited(
  createdAt?: string | Date | null,
  updatedAt?: string | Date | null
): boolean {
  if (!createdAt || !updatedAt) return false;
  try {
    const createdTime = new Date(createdAt).getTime();
    const updatedTime = new Date(updatedAt).getTime();
    if (isNaN(createdTime) || isNaN(updatedTime)) return false;
    return updatedTime - createdTime >= 30000;
  } catch {
    return false;
  }
}

/**
 * Formats updated date into "31 Agu 2026, 11.21" format in centralized application timezone.
 */
export function formatUpdatedDate(updatedAt?: string | Date | null): string {
  if (!updatedAt) return "";
  try {
    const datePart = formatLocalDate(
      updatedAt,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
      ""
    );
    const timePart = formatTime(updatedAt, false);
    if (!datePart || !timePart) return "";
    return `${datePart}, ${timePart}`;
  } catch {
    return "";
  }
}
