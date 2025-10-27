import { Agent, setGlobalDispatcher } from "undici";
import tls from "node:tls";
import { checkServerIdentity } from "./tlsPin";

const keepAlive = process.env.HTTP_KEEPALIVE === "true";
const max = Number(process.env.HTTP_KEEPALIVE_MAX_SOCKETS || 256);
const kaTimeout = Number(process.env.HTTP_KEEPALIVE_TIMEOUT_MS || 60000);

export const httpAgent = new Agent({
  connect: {
    // Node TLS seçenekleri Undici'ye geçer
    checkServerIdentity: (host: string, cert: tls.PeerCertificate) => {
      try {
        checkServerIdentity(host, cert);
      } catch (e) {
        throw e;
      }
      return undefined; // standart doğrulama da çalışsın
    }
  },
  keepAliveTimeout: kaTimeout,
  keepAliveMaxTimeout: kaTimeout + 30000,
  connections: max,
  pipelining: 1
});

if (keepAlive) {
  setGlobalDispatcher(httpAgent);
  console.log(`[HTTP] Keep-Alive enabled: max=${max}, timeout=${kaTimeout}ms`);
} else {
  console.log(`[HTTP] Keep-Alive disabled`);
} 