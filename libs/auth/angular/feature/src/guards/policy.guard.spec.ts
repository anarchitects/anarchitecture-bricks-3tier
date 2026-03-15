import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';

import { provideHttpClient } from '@angular/common/http';
import { policyGuard } from './policy.guard';

describe('policyGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => policyGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: AuthStore,
          useValue: {
            ability: () => undefined,
          },
        },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
  it('should deny access when ability is not defined', () => {
    const routeMock = {
      data: { action: 'read', subject: 'Document' },
    };
    const canMatch = executeGuard(routeMock, []);
    expect(canMatch).toBe(false);
  });
});
