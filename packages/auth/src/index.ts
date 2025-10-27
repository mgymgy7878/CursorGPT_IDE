export type Role = 'admin' | 'user' | 'viewer';

export type User = {
  id: string;
  email?: string;
  role: Role;
};

export const requireRole =
  (role: Role) =>
  (u: User | undefined): u is User =>
    !!u && u.role === role;

export const isAuthenticated = (u: User | undefined): u is User => !!u;

// Barrel exports
export * from './jwt.js';
