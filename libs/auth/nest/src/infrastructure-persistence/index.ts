// Entities
export * from './entities/account.entity';
export * from './entities/auth-user.entity';
export * from './entities/permission.entity';
export * from './entities/role.entity';
export * from './entities/session.entity';
export { AuthUserEntity as UserEntity } from './entities/auth-user.entity';
export * from './entities/verification.entity';

// Migrations
export * from './migrations/1720200000000-create-auth-schema';
export * from './migrations/1788275931000-add-better-auth-account-issuer';

// Optional passkey persistence: symbols are public; registration remains opt-in.
export * from '../infrastructure-engine/better-auth/plugins/passkeys/passkey.entity';
export * from '../infrastructure-engine/better-auth/plugins/passkeys/migrations/1760200001000-create-better-auth-passkeys-table';
export * from '../infrastructure-engine/better-auth/plugins/passkeys/migrations/1790899200000-expand-passkey-credential-storage';

// Repositories & Ports
export * from '../application/ports/auth-account.repository';
export * from '../application/ports/auth-user.repository';

// Module & Config
export type { AuthPersistenceModuleOptions } from '../config';
export * from './persistence.module';
