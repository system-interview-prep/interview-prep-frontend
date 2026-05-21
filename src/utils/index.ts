/**
 * utils/index.ts – Shared utility functions for the frontend.
 */

/**
 * Formats an ISO timestamp to a human-readable "HH:MM" string.
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Generates a random room ID (UUID v4 equivalent in browser).
 */
export function generateRoomId(): string {
  return crypto.randomUUID();
}

/**
 * Decodes the payload from a JWT token without verifying the signature.
 * For display purposes only – verify server-side for security.
 */
export function decodeJwt<T = Record<string, any>>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as T;
  } catch {
    return null;
  }
}

/**
 * Trims and returns null if the string is empty/whitespace.
 */
export function presence(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export { humanizeKey } from "./humanizeKey";
