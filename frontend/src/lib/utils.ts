import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO timestamp string or Date into 12-hour clock format (e.g. "2:20 PM", "12:05 AM").
 * Returns an empty string for missing or invalid inputs without throwing.
 */
export function formatMessageTime(isoStringOrDate?: string | Date | null): string {
  if (!isoStringOrDate) return "";
  try {
    const date =
      typeof isoStringOrDate === "string" ? new Date(isoStringOrDate) : isoStringOrDate;
    if (isNaN(date.getTime())) return "";

    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

    // Normalize any narrow non-breaking space (U+202F) to standard space
    return formatted.replace(/\u202f/g, " ");
  } catch {
    return "";
  }
}
