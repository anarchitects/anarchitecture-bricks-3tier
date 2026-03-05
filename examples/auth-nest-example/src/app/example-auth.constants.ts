export const AUTH_EXAMPLE_SEEDS = {
  admin: {
    id: 'admin-user-id',
    email: 'admin@example.com',
    userName: 'admin',
    password: 'adminpass123',
    rbac: [{ action: 'read', subject: 'admin-panel' }] as const,
  },
  member: {
    id: 'member-user-id',
    email: 'member@example.com',
    userName: 'member',
    password: 'memberpass123',
    rbac: [{ action: 'read', subject: 'profile' }] as const,
  },
  pending: {
    id: 'pending-user-id',
    email: 'pending@example.com',
    userName: 'pending',
    password: 'pendingpass123',
    token: 'activate-seed-token',
    rbac: [] as const,
  },
  verify: {
    id: 'verify-user-id',
    email: 'verify@example.com',
    userName: 'verify',
    password: 'verifypass123',
    token: 'verify-seed-token',
    rbac: [] as const,
  },
} as const;
