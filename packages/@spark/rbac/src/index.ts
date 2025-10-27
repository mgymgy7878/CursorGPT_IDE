export interface Role {
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  roles: string[];
}

export const ROLES = {
  ADMIN: 'admin',
  TRADER: 'trader',
  VIEWER: 'viewer'
} as const;

export const PERMISSIONS = {
  READ_PORTFOLIO: 'read:portfolio',
  WRITE_PORTFOLIO: 'write:portfolio',
  READ_STRATEGIES: 'read:strategies',
  WRITE_STRATEGIES: 'write:strategies',
  EXECUTE_TRADES: 'execute:trades',
  VIEW_ANALYTICS: 'view:analytics',
  MANAGE_USERS: 'manage:users'
} as const;

export function hasRole(user: User, role: string): boolean {
  return user.roles.includes(role);
}

export function hasPermission(user: User, permission: string): boolean {
  // Admin has all permissions
  if (hasRole(user, ROLES.ADMIN)) return true;
  
  // Simple permission check - can be extended with role-permission mapping
  const rolePermissions: Record<string, string[]> = {
    [ROLES.TRADER]: [
      PERMISSIONS.READ_PORTFOLIO,
      PERMISSIONS.WRITE_PORTFOLIO,
      PERMISSIONS.READ_STRATEGIES,
      PERMISSIONS.WRITE_STRATEGIES,
      PERMISSIONS.EXECUTE_TRADES,
      PERMISSIONS.VIEW_ANALYTICS
    ],
    [ROLES.VIEWER]: [
      PERMISSIONS.READ_PORTFOLIO,
      PERMISSIONS.READ_STRATEGIES,
      PERMISSIONS.VIEW_ANALYTICS
    ]
  };
  
  return user.roles.some(role => 
    rolePermissions[role]?.includes(permission)
  );
} 