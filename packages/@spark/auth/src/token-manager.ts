import jwt from "jsonwebtoken";

export interface TokenManagerOptions {
  secret: string;
  expiresIn?: string;
}

export class TokenManager {
  private secret: string;
  private expiresIn: string;

  constructor(options: TokenManagerOptions) {
    this.secret = options.secret;
    this.expiresIn = options.expiresIn || '12h';
  }

  sign(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  decode(token: string): any {
    return jwt.decode(token);
  }
} 