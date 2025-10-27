/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEffectiveKillSwitch, writeOverride } from "../lib/policy.js";

export default async function register(app: any) {
  const routePath = "/canary/policy/kill-switch.apply";
  const handler = async (req: any, reply: any) => {
    const tokenHdr = (req.headers?.["x-confirm-token"] || "") as string;
    const roleHdr = (req.headers?.["x-user-role"] || "") as string;
    const TOKEN = process.env.CONFIRM_TOKEN ?? "";
    const tokenVerified = !!(TOKEN && tokenHdr && tokenHdr === TOKEN);
    const rbacOk = (roleHdr || "").toLowerCase() === "admin";

    const desired = !!((req.body ?? {}).killSwitch === false ? false : (req.body ?? {}).killSwitch);
    // confirm gate
    const accepted = tokenVerified && rbacOk;
    const reason = accepted ? "ok" : [tokenVerified?null:"confirm_required", rbacOk?null:"rbac_denied"].filter(Boolean).join(",");

    let effective = getEffectiveKillSwitch();
    if (accepted) {
      writeOverride({ killSwitch: desired });
      effective = getEffectiveKillSwitch();
    }

    return reply.send({ accepted, reason, effective });
  };

  (app as any).post?.(routePath, handler) ?? (app as any).route?.({ method: "POST", url: routePath, handler });
} 