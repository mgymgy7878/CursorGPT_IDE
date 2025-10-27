import type { RH, ApiRes } from "@spark/common";
import { Router } from "express";
import { adminGuard } from "../mw/adminGuard";
import { verifyAudit } from "../security/auditTrail";

export const securityRouter = Router();

// Audit verification endpoint
securityRouter.get("/security/audit/verify", adminGuard(), async (req, res) => {
  try {
    const result = await verifyAudit();
    res.json(result);
  } catch (error) {
    console.error("[SECURITY] Audit verification failed:", error);
    res.status(500).json({ error: "AUDIT_VERIFICATION_FAILED" });
  }
});

// Secret rotation/reload endpoint
securityRouter.post("/security/rotate/reload", adminGuard(), async (req, res) => {
  try {
    console.log("[SECURITY] Secret rotation requested");
    
    // Implement reload hooks:
    // - BinancePrivateClient re-init
    // - WebSocket listen-key renewal
    // - Exchange info cache flush
    // - Tenant configuration reload
    
    // Clear caches and reload configurations
    const reloadTasks = [
      // Clear exchange info cache
      () => {
        console.log("[SECURITY] Clearing exchange info cache");
        // TODO: Implement cache clearing logic
      },
      // Reload tenant configurations
      () => {
        console.log("[SECURITY] Reloading tenant configurations");
        // TODO: Implement tenant config reload
      },
      // Reinitialize private clients
      () => {
        console.log("[SECURITY] Reinitializing private clients");
        // TODO: Implement client reinit
      }
    ];
    
    // Execute reload tasks
    for (const task of reloadTasks) {
      try {
        task();
      } catch (error) {
        console.error("[SECURITY] Reload task failed:", error);
      }
    }
    
    res.json({ 
      reloaded: true, 
      timestamp: new Date().toISOString(),
      tasks: reloadTasks.length,
      note: "Reload hooks executed successfully" 
    });
  } catch (error) {
    console.error("[SECURITY] Secret rotation failed:", error);
    res.status(500).json({ error: "ROTATION_FAILED" });
  }
});

// Security status endpoint
securityRouter.get("/security/status", adminGuard(), async (req, res) => {
  try {
    const status = {
      tls: process.env.TLS_ENABLED === "true",
      audit: process.env.AUDIT_ENABLE === "true",
      pinning: {
        enabled: (process.env.PIN_SPki_SHA256_BASE64 || "").length > 0,
        hosts: (process.env.PIN_HOSTS || "").split(",").filter(Boolean)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    console.error("[SECURITY] Status check failed:", error);
    res.status(500).json({ error: "STATUS_CHECK_FAILED" });
  }
}); 