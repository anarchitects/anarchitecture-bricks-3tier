import { User } from '@anarchitects/auth-ts/models';
import { UnauthorizedException } from '@nestjs/common';

export type AuthRuntimeRequest = {
  user?: User;
  headers?: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
};

export const requireAuthenticatedUser = (request: AuthRuntimeRequest): User => {
  if (!request.user) {
    throw new UnauthorizedException('User not authenticated');
  }

  return request.user;
};
