import crypto from "node:crypto";
import tls from "node:tls";

const pins = (process.env.PIN_SPki_SHA256_BASE64 || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const hosts = new Set(
  (process.env.PIN_HOSTS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
);

export function checkServerIdentity(host: string, cert: tls.PeerCertificate) {
  if (!hosts.has(host) || pins.length === 0) {
    return; // pin uygulanmıyor
  }

  try {
    // SPKI => SHA256 => base64
    const spkiDer = cert.raw; // Node 20: raw DER (whole cert)
    
    // SPKI çıkarmak için publicKey kullanılır
    const pub = cert.pubkey || (cert as any).publicKey; // bazı node sürümleri
    const spki = pub ? Buffer.from(pub) : spkiDer; // fallback
    
    const hash = crypto.createHash("sha256").update(spki).digest("base64");
    
    if (!pins.includes(hash)) {
      throw new Error(`TLS_PIN_FAIL host=${host} got=${hash.slice(0, 12)}... expected=${pins.join(",")}`);
    }
    
    console.log(`[TLS_PIN] Verified ${host} with hash ${hash.slice(0, 12)}...`);
  } catch (error) {
    console.error(`[TLS_PIN] Failed to verify ${host}:`, error);
    throw error;
  }
} 