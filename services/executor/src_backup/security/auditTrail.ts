import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const DIR = process.env.AUDIT_LOG_DIR || "runtime/audit";
let pub: Buffer, priv: Buffer;

export async function auditInit() {
  try {
    await fs.mkdir(DIR, { recursive: true });
    priv = await fs.readFile(process.env.AUDIT_PRIV_KEY_FILE!);
    pub = await fs.readFile(process.env.AUDIT_PUB_KEY_FILE!);
    console.log("[AUDIT] Initialized with keys");
  } catch (error) {
    console.error("[AUDIT] Failed to initialize:", error);
    throw error;
  }
}

type AuditEntry = {
  ts: number;
  type: string;
  data: any;
  prevHash?: string;
  sig?: string;
  hash?: string;
};

async function hashOf(x: any): Promise<string> {
  return crypto.createHash("sha256").update(JSON.stringify(x)).digest("hex");
}

function sign(buf: Buffer): string {
  return crypto.sign(null, buf, { key: priv, dsaEncoding: "ieee-p1363" }).toString("base64");
}

function verify(buf: Buffer, sigB64: string): boolean {
  if (!sigB64) return false;
  return crypto.verify(null, buf, { key: pub }, Buffer.from(sigB64, "base64"));
}

export const auditTrail = {
  write: writeAudit,
  verify: verifyAudit
};

export async function writeAudit(type: string, data: any) {
  if ((process.env.AUDIT_ENABLE || "true") !== "true") {
    return;
  }

  try {
    const file = path.join(DIR, "audit.ndjson");
    let prevHash = "";

    try {
      const content = await fs.readFile(file, "utf8");
      const lines = content.trim().split(/\r?\n/);
      const last = lines[lines.length - 1];
      if (last) {
        const parsed = JSON.parse(last);
        prevHash = parsed.hash || "";
      }
    } catch {
      // File doesn't exist or is empty
    }

    const base: AuditEntry = { ts: Date.now(), type, data, prevHash };
    const payload = Buffer.from(JSON.stringify(base));
    const sig = sign(payload);
    const hash = await hashOf({ ...base, sig });
    const rec = { ...base, sig, hash };

    await fs.appendFile(file, JSON.stringify(rec) + "\n");
    console.log(`[AUDIT] Written ${type} entry with hash ${hash.slice(0, 8)}...`);
  } catch (error) {
    console.error("[AUDIT] Failed to write audit entry:", error);
    throw error;
  }
}

export async function verifyAudit() {
  try {
    const file = path.join(DIR, "audit.ndjson");
    const content = await fs.readFile(file, "utf8");
    const lines = content.trim().split(/\r?\n/).filter(Boolean);

    if (lines.length === 0) {
      return { ok: true, count: 0, message: "No audit entries" };
    }

    let prev = "";
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const obj = JSON.parse(l);
      const { sig, hash, ...base } = obj;

      // Verify signature
      const ok = verify(Buffer.from(JSON.stringify(base)), sig);
      if (!ok) {
        return { ok: false, at: base.ts, reason: "BAD_SIG", line: i + 1 };
      }

      // Verify chain
      const chain = prev === (base.prevHash || "");
      if (!chain && i > 0) {
        return { ok: false, at: base.ts, reason: "BAD_CHAIN", line: i + 1 };
      }

      // Verify hash
      const rehash = await hashOf({ ...base, sig });
      if (rehash !== hash) {
        return { ok: false, at: base.ts, reason: "BAD_HASH", line: i + 1 };
      }

      prev = hash;
    }

    return { ok: true, count: lines.length, message: "All entries verified" };
  } catch (error) {
    console.error("[AUDIT] Verification failed:", error);
    return { ok: false, reason: "VERIFICATION_ERROR", error: (error as Error).message };
  }
} 