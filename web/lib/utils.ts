import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Use this everywhere instead of raw className strings.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to locale-appropriate string.
 */
export function formatNumber(n: number, locale: string = "en-IN"): string {
  return new Intl.NumberFormat(locale).format(n);
}

/**
 * Format a date to locale-appropriate string.
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-IN"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format marks with consistent display (e.g., "7.5 / 10").
 */
export function formatMarks(marks: number, maxMarks: number): string {
  return `${marks} / ${maxMarks}`;
}
