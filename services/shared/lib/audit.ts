/**
 * HMAC-based Audit Logging with KVKK/GDPR Compliance
 * 
 * Features:
 * - HMAC-SHA256 payload integrity
 * - PII masking (email, phone, etc.)
 * - Payload truncation for large data
 * - Canonical JSON for consistent hashing
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// HMAC Hashing
// ============================================

function canonicalJSON(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  const sorted = Object.keys(obj as any)
    .sort()
    .reduce((acc, key) => {
      acc[key] = (obj as any)[key];
      return acc;
    }, {} as any);
  
  return JSON.stringify(sorted);
}

export function hmacHash(payload: unknown): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  
  if (!secret) {
    throw new Error('AUDIT_HMAC_SECRET not configured');
  }
  
  return crypto
    .createHmac('sha256', secret)
    .update(canonicalJSON(payload))
    .digest('hex');
}

// ============================================
// Payload Masking (KVKK/GDPR)
// ============================================

interface MaskOptions {
  mask?: string[];      // Fields to mask completely
  hash?: string[];      // Fields to hash (PII)
  truncate?: number;    // Max payload size
}

export function maskPayload(
  payload: any,
  options: MaskOptions = {}
): any {
  const {
    mask = ['password', 'apiKey', 'secret', 'token'],
    hash = ['email', 'phone', 'address'],
    truncate = 10000,
  } = options;
  
  const masked = { ...payload };
  
  // Mask sensitive fields
  for (const field of mask) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }
  
  // Hash PII
  for (const field of hash) {
    if (masked[field]) {
      masked[field] = crypto
        .createHash('sha256')
        .update(String(masked[field]))
        .digest('hex')
        .slice(0, 16); // First 16 chars for identification
    }
  }
  
  // Truncate large payloads
  const json = JSON.stringify(masked);
  if (json.length > truncate) {
    return {
      ...masked,
      _truncated: true,
      _originalSize: json.length,
      _truncatedAt: truncate,
    };
  }
  
  return masked;
}

// ============================================
// Audit Logger
// ============================================

export async function auditLog(
  action: string,
  actor: string,
  payload: unknown,
  options?: MaskOptions
) {
  const maskedPayload = maskPayload(payload, options);
  const hash = hmacHash(maskedPayload);
  
  await prisma.auditLog.create({
    data: {
      action,
      actor,
      payload: maskedPayload as any,
      hash,
      timestamp: new Date(),
    },
  });
}

// ============================================
// Secret Rotation Check
// ============================================

export async function checkSecretRotation(): Promise<boolean> {
  const ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days
  
  const lastRotation = await prisma.auditLog.findFirst({
    where: { action: 'secret_rotation' },
    orderBy: { timestamp: 'desc' },
  });
  
  if (!lastRotation) {
    console.warn('⚠️ No secret rotation record found');
    return false;
  }
  
  const timeSinceRotation = Date.now() - lastRotation.timestamp.getTime();
  
  if (timeSinceRotation > ROTATION_INTERVAL) {
    console.warn(`⚠️ Secret rotation overdue by ${Math.floor(timeSinceRotation / (24 * 60 * 60 * 1000))} days`);
    return false;
  }
  
  return true;
}

// ============================================
// Usage Examples
// ============================================

// Example 1: Order placement
// await auditLog('order_place', userId, { orderId, symbol, quantity });

// Example 2: User login (mask password)
// await auditLog('user_login', userId, { email, password, ip }, { mask: ['password'] });

// Example 3: API key creation (hash key)
// await auditLog('api_key_create', userId, { keyId, key }, { hash: ['key'] });

