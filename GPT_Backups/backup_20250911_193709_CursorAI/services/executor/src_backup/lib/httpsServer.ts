import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import type { Express } from "express";

export function startHttpLike(app: Express, port: number) {
  const tls = process.env.TLS_ENABLED === "true";
  
  if (!tls) {
    return http.createServer(app).listen(port, () => {
      console.log(`[HTTPS] HTTP server listening on port ${port}`);
    });
  }

  try {
    const key = fs.readFileSync(process.env.TLS_KEY_FILE!);
    const cert = fs.readFileSync(process.env.TLS_CERT_FILE!);
    const ca = process.env.TLS_CLIENT_CA_FILE 
      ? fs.readFileSync(process.env.TLS_CLIENT_CA_FILE) 
      : undefined;

    const server = https.createServer({
      key,
      cert,
      ca,
      requestCert: (process.env.TLS_REQUEST_CLIENT_CERT || "true") === "true",
      rejectUnauthorized: !!ca, // mTLS: CA varsa client cert zorunlu
    }, app);

    return server.listen(port, () => {
      console.log(`[HTTPS] HTTPS${ca ? '(mTLS)' : ''} server listening on port ${port}`);
    });
  } catch (error) {
    console.error("[HTTPS] Failed to start HTTPS server:", error);
    console.log("[HTTPS] Falling back to HTTP server");
    return http.createServer(app).listen(port, () => {
      console.log(`[HTTPS] HTTP server listening on port ${port}`);
    });
  }
} 