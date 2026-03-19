import type { Request } from 'express';
import { z } from 'zod';

const deviceHeaderSchema = z.object({
  'x-device-id': z.string().trim().min(8).max(128),
});

/**
 * Parse optional `x-device-id` header for guest/device-scoped APIs.
 * Returns `null` when missing or invalid (callers may treat as anonymous without device scope).
 */
export function readOptionalDeviceId(req: Request): string | null {
  const raw = req.get('x-device-id');
  if (!raw) return null;
  const parsed = deviceHeaderSchema.safeParse({ 'x-device-id': raw });
  if (!parsed.success) return null;
  return parsed.data['x-device-id'];
}
