export interface AuditEntry {
  timestamp: string;
  userId: string;
  userRole: string;
  action: string;
  details: Record<string, any>;
  requestId?: string;
  ip?: string;
}

export function writeAudit(
  userId: string, 
  userRole: string, 
  action: string, 
  details: Record<string, any> = {},
  requestId?: string,
  ip?: string
) {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    userId,
    userRole,
    action,
    details,
    requestId,
    ip
  };

  // Console'a yaz (production'da file/db'ye yazılabilir)
  console.log(`[AUDIT] ${entry.timestamp} ${userId}(${userRole}) ${action}:`, details);
  
  // TODO: File veya DB'ye persist et
  return entry;
}

// Kritik aksiyonlar için helper'lar
export const AUDIT_ACTIONS = {
  STRATEGY_START: "strategy:start",
  EXECUTION_CREATE: "execution:create", 
  EXECUTION_CONFIRM: "execution:confirm",
  EXECUTION_CANCEL: "execution:cancel",
  RISK_HALT: "risk:halt",
  KILLSWITCH_TOGGLE: "killswitch:toggle",
  RBAC_BLOCKED: "rbac:blocked",
  AUTH_FAILED: "auth:failed"
} as const; 