// BTCTurk API Signer
import crypto from "crypto";

export class BTCTurkSigner {
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  signRequest(method: string, path: string, body?: string): string {
    // TODO: Implement HMAC-SHA256 signing
    console.log(`Signing ${method} ${path}`);
    return "signed_request";
  }
}

export function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", Buffer.from(secret)).update(payload).digest("base64");
} 