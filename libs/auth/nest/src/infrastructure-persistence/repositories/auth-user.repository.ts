import { Injectable } from '@nestjs/common';
import { User } from '@anarchitects/auth-ts/models';

@Injectable()
export abstract class AuthUserRepository {
  abstract find(conditions: unknown): Promise<User[]>;
  abstract findOne(conditions: unknown): Promise<User>;
  abstract create(user: Partial<User>): Promise<User>;
  abstract update(user: Partial<User>): Promise<User>;
  abstract delete(userId: string): Promise<User>;
  abstract invalidateTokens(
    tokens: string[],
    userId: string | null
  ): Promise<void>;
  abstract isTokenInvalidated(tokenId: string): Promise<boolean>;
}
