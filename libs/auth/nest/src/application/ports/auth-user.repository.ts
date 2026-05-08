import { Injectable } from '@nestjs/common';
import { AuthUser } from '@anarchitects/auth-ts/models';

@Injectable()
export abstract class AuthUserRepository {
  abstract find(conditions: unknown): Promise<AuthUser[]>;
  abstract findOne(conditions: unknown): Promise<AuthUser>;
  abstract ensureRole(userId: string, roleName: string): Promise<void>;
  abstract create(authUser: Partial<AuthUser>): Promise<AuthUser>;
  abstract update(authUser: Partial<AuthUser>): Promise<AuthUser>;
  abstract delete(userId: string): Promise<AuthUser>;
}
