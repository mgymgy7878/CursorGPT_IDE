import fs from "node:fs";
import path from "node:path";

export type PolicyOverride = { killSwitch?: boolean; ts: string };
export type PolicyEffective = { killSwitch: boolean; source: "override" | "env"; override: PolicyOverride | null };

const OVERRIDE_FILE = path.resolve(process.cwd(), "evidence", "canary", "policy.override.json");

export function readOverride(): PolicyOverride | null {
  try {
    const txt = fs.readFileSync(OVERRIDE_FILE, "utf8");
    const obj = JSON.parse(txt);
    if (typeof obj === "object" && obj) return obj as PolicyOverride;
    return null;
  } catch {
    return null;
  }
}

export function writeOverride(update: Partial<PolicyOverride>): PolicyOverride {
  const current = readOverride() || { ts: new Date().toISOString() } as PolicyOverride;
  const next: PolicyOverride = { ...current, ...update, ts: new Date().toISOString() };
  fs.mkdirSync(path.dirname(OVERRIDE_FILE), { recursive: true });
  fs.writeFileSync(OVERRIDE_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function getEffectiveKillSwitch(): PolicyEffective {
  const envKill = (process.env.KILL_SWITCH ?? "1") === "1";
  const ov = readOverride();
  if (ov && typeof ov.killSwitch === "boolean") {
    return { killSwitch: ov.killSwitch, source: "override", override: ov };
  }
  return { killSwitch: envKill, source: "env", override: ov };
} 