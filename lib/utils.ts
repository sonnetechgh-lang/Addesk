import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip control characters, ANSI escape codes, and truncate to prevent log injection (CWE-117) */
export const sanitizeLog = (msg: unknown): string =>
  String(msg)
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove all control characters
    .replace(/\x1b\[[0-9;]*m/g, '')          // Remove ANSI escape codes
    .slice(0, 1000)                            // Prevent log flooding
