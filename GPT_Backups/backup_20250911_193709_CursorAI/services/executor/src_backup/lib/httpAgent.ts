import http from "node:http";
import https from "node:https";

export const httpAgent = new http.Agent({ 
  keepAlive: process.env.HTTP_KEEPALIVE === "true", 
  maxSockets: Number(process.env.HTTP_KEEPALIVE_MAX_SOCKETS || 64) 
});

export const httpsAgent = new https.Agent({ 
  keepAlive: process.env.HTTP_KEEPALIVE === "true", 
  maxSockets: Number(process.env.HTTP_KEEPALIVE_MAX_SOCKETS || 64) 
}); 