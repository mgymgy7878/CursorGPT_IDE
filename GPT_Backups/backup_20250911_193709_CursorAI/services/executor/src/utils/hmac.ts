import crypto from "crypto";

export const sha256hex = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export const hmac256 = (key: string, msg: string) => crypto.createHmac("sha256", key).update(msg).digest("hex");

export const signString = (method: string, path: string, ts: string, nonce: string, body: string) =>
  `${method.toUpperCase()}\n${path}\n${ts}\n${nonce}\n${sha256hex(body ?? "")}`; 