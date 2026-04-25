import { AUTH_PUBLIC_METADATA_KEY } from '@anarchitects/auth-declarations';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const isPublicRoute = (
  reflector: Reflector,
  context: ExecutionContext,
): boolean =>
  reflector.getAllAndOverride<boolean>(AUTH_PUBLIC_METADATA_KEY, [
    context.getHandler(),
    context.getClass(),
  ]) === true;
