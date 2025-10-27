// services/executor/src/plugins/rbac.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * User roles for RBAC (Role-Based Access Control)
 */
export type UserRole = 'viewer' | 'trader' | 'admin';

/**
 * Allowed roles set
 */
const ALLOWED_ROLES = new Set<UserRole>(['viewer', 'trader', 'admin']);

/**
 * Trade-sensitive endpoints requiring trader or admin role
 */
const TRADE_SENSITIVE_PATHS = [
  '/futures/order.place',
  '/futures/order.cancel',
  '/futures/order.cancelAll',
  '/futures/leverage',
  '/futures/marginType',
  '/canary/confirm',
  '/ai/exec', // Action execution requires trader role
];

/**
 * Admin-only endpoints
 */
const ADMIN_ONLY_PATHS = [
  '/futures/risk/circuit-breaker/close',
  '/admin/params',
];

/**
 * Get user role from request headers
 * Default to 'viewer' if not specified
 */
function getRoleFromRequest(request: FastifyRequest): UserRole {
  const role = request.headers['x-spark-role'] as string;
  
  // Default to viewer if not specified or invalid
  if (!role || !ALLOWED_ROLES.has(role as UserRole)) {
    return 'viewer';
  }
  
  return role as UserRole;
}

/**
 * RBAC (Role-Based Access Control) plugin
 * Validates user roles before allowing access to endpoints
 */
export async function rbacPlugin(app: FastifyInstance) {
  console.log('[RBAC] Plugin initialized');

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const role = getRoleFromRequest(request);
    const path = request.routerPath || '';

    // Log request with role
    app.log.debug({
      role,
      method: request.method,
      path,
    }, 'RBAC check');

    // Check if role is allowed
    if (!ALLOWED_ROLES.has(role)) {
      app.log.warn({ role, path }, 'RBAC: Invalid role');
      return reply.code(403).send({
        error: 'RBAC.Forbidden',
        role,
        message: `Invalid role: ${role}. Allowed roles: viewer, trader, admin`,
      });
    }

    // Check admin-only paths
    if (ADMIN_ONLY_PATHS.some(p => path.includes(p))) {
      if (role !== 'admin') {
        app.log.warn({ role, path }, 'RBAC: Admin required');
        return reply.code(403).send({
          error: 'RBAC.AdminRequired',
          role,
          requiredRole: 'admin',
          message: 'This endpoint requires admin role',
        });
      }
    }

    // Check trade-sensitive paths
    if (TRADE_SENSITIVE_PATHS.some(p => path.includes(p))) {
      if (role !== 'trader' && role !== 'admin') {
        app.log.warn({ role, path }, 'RBAC: Trader or admin required');
        return reply.code(403).send({
          error: 'RBAC.TraderRequired',
          role,
          requiredRole: 'trader or admin',
          message: 'This endpoint requires trader or admin role',
        });
      }
    }

    // Log successful access
    app.log.debug({ role, path }, 'RBAC: Access granted');
  });

  // Endpoint to get current role
  app.get('/rbac/status', async (request) => {
    const role = getRoleFromRequest(request);
    return {
      role,
      allowedRoles: Array.from(ALLOWED_ROLES),
      permissions: {
        canView: true,
        canTrade: role === 'trader' || role === 'admin',
        canAdmin: role === 'admin',
      },
    };
  });

  app.log.info('✅ RBAC plugin registered');
}

