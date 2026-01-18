/**
 * Browser shim for node:crypto's randomUUID.
 * Uses the Web Crypto API which is available in all modern browsers.
 */
export function randomUUID(): string {
  return crypto.randomUUID()
}
