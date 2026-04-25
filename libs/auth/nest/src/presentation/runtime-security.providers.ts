import { Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AuthorizationGuard } from './guards/authorization.guard';

export const provideAuthRuntimeGuards = (): Provider[] => [
  {
    provide: APP_GUARD,
    useExisting: AuthenticationGuard,
  },
  {
    provide: APP_GUARD,
    useExisting: AuthorizationGuard,
  },
];
