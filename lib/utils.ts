import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Strip newline/tab characters from external strings before logging to prevent log injection (CWE-117) */
export const sanitizeLog = (msg: unknown): string =>
  String(msg).replace(/[\r\n\t]/g, ' ')
