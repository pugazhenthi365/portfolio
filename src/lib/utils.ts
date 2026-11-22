import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-02-01" -> "Feb 2025". Timezone-safe (parses the string directly). */
export function formatMonthYear(date: string | null | undefined): string {
  if (!date) return "";
  const [y, m] = date.split("-");
  const idx = Number(m) - 1;
  return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${y}` : y;
}

export function formatRange(start: string, end: string | null, isCurrent: boolean) {
  return `${formatMonthYear(start)} — ${isCurrent || !end ? "Present" : formatMonthYear(end)}`;
}

export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const projectStatusLabel: Record<string, string> = {
  live: "Live",
  completed: "Completed",
  in_progress: "Ongoing",
  paused: "Development paused",
  concept: "Concept",
};

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
