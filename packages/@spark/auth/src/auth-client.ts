import { TokenManager } from "./token-manager";

export interface AuthClientOptions {
  secret: string;
  expiresIn?: string;
}

export class AuthClient {
  private tokenManager: TokenManager;

  constructor(options: AuthClientOptions) {
    this.tokenManager = new TokenManager(options);
  }

  createToken(payload: any): string {
    return this.tokenManager.sign(payload);
  }

  verifyToken(token: string): any {
    return this.tokenManager.verify(token);
  }

  extractBearer(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  isDevAuth(): boolean {
    return process.env.DEV_AUTH === '1';
  }
}

export function createAuthorizedApi(secret: string) {
  return new AuthClient({ secret });
} 