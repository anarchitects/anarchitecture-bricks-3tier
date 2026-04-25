import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { provideAuthRuntimeGuards } from './runtime-security.providers';

describe('provideAuthRuntimeGuards', () => {
  it('registers authentication before authorization at the app shell', () => {
    expect(provideAuthRuntimeGuards()).toEqual([
      {
        provide: APP_GUARD,
        useExisting: AuthenticationGuard,
      },
      {
        provide: APP_GUARD,
        useExisting: AuthorizationGuard,
      },
    ]);
  });
});
