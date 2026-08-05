/**
 * Utilities for consistent date formatting across the application.
 */

/**
 * Format any date string or Date object into a human-readable relative time string in Indonesian.
 * Strips trailing 'Z' if present to parse local server dates in the browser's local timezone correctly.
 */
export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!dateInput) return fallback;
  try {
    const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
    const cleanDateStr = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
    const past = new Date(cleanDateStr);
    if (isNaN(past.getTime())) return fallback;

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - past.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 30) return `${diffDays} hari lalu`;

    return past.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: past.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return fallback;
  }
}

/**
 * Formats a date object/string for HTML <input type="datetime-local"> using local timezone bounds.
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
 * Formats a date object/string in Indonesian locale without timezone shift issues.
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
    const dateStr = typeof dateInput === "string" ? dateInput : dateInput.toISOString();
    const cleanDateStr = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
    const d = new Date(cleanDateStr);
    if (isNaN(d.getTime())) return fallback;

    return d.toLocaleDateString("id-ID", options);
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
    const createdStr = typeof createdAt === "string" ? createdAt : createdAt.toISOString();
    const updatedStr = typeof updatedAt === "string" ? updatedAt : updatedAt.toISOString();
    const cleanCreated = createdStr.endsWith("Z") ? createdStr.slice(0, -1) : createdStr;
    const cleanUpdated = updatedStr.endsWith("Z") ? updatedStr.slice(0, -1) : updatedStr;

    const createdTime = new Date(cleanCreated).getTime();
    const updatedTime = new Date(cleanUpdated).getTime();
    return updatedTime - createdTime >= 30000;
  } catch {
    return false;
  }
}

/**
 * Formats updated date into "1 Agu 2026, 18.08" format.
 */
export function formatUpdatedDate(updatedAt?: string | Date | null): string {
  if (!updatedAt) return "";
  try {
    const formatted = formatLocalDate(
      updatedAt,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
      ""
    );
    return formatted.replace(":", ".");
  } catch {
    return "";
  }
}
