import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { CanMatchFn } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { createAppAbility } from '@anarchitects/auth-angular/util';
import { PolicyRule } from '@anarchitects/auth-ts/models';
import { provideHttpClient } from '@angular/common/http';
import { policyGuard } from './policy.guard';

describe('policyGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => policyGuard(...guardParameters));

  const setup = ({
    initialized = true,
    rbac = [],
  }: {
    initialized?: boolean;
    rbac?: PolicyRule[];
  } = {}) => {
    const initializedSignal = signal(initialized);
    const rbacSignal = signal(rbac);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: AuthStore,
          useValue: {
            ability: signal(createAppAbility(rbac)),
            initialized: initializedSignal,
            rbac: rbacSignal,
          },
        },
      ],
    });

    return { initializedSignal, rbacSignal };
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    setup();
    expect(executeGuard).toBeTruthy();
  });

  it('should deny access when no matching rules are present', async () => {
    setup();

    const canMatch = await firstValueFrom(
      executeGuard(
        { data: { action: 'read', subject: 'Document' } } as never,
        [],
      ) as Observable<boolean>,
    );

    expect(canMatch).toBe(false);
  });

  it('should allow unconditional route rules', async () => {
    setup({
      rbac: [{ action: 'read', subject: 'Document' }],
    });

    const canMatch = await firstValueFrom(
      executeGuard(
        { data: { action: 'read', subject: 'Document' } } as never,
        [],
      ) as Observable<boolean>,
    );

    expect(canMatch).toBe(true);
  });

  it('should allow conditional rules as coarse route checks', async () => {
    setup({
      rbac: [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ],
    });

    const canMatch = await firstValueFrom(
      executeGuard(
        { data: { action: 'update', subject: 'Post' } } as never,
        [],
      ) as Observable<boolean>,
    );

    expect(canMatch).toBe(true);
  });

  it('should deny when an unconditional deny matches the route', async () => {
    setup({
      rbac: [{ action: 'update', subject: 'Post', inverted: true }],
    });

    const canMatch = await firstValueFrom(
      executeGuard(
        { data: { action: 'update', subject: 'Post' } } as never,
        [],
      ) as Observable<boolean>,
    );

    expect(canMatch).toBe(false);
  });

  it('should wait until auth initialization completes before resolving', async () => {
    const { initializedSignal } = setup({
      initialized: false,
      rbac: [{ action: 'read', subject: 'Document' }],
    });

    const canMatchPromise = firstValueFrom(
      executeGuard(
        { data: { action: 'read', subject: 'Document' } } as never,
        [],
      ) as Observable<boolean>,
    );

    initializedSignal.set(true);

    await expect(canMatchPromise).resolves.toBe(true);
  });

  it('should fail closed for malformed rule arrays', async () => {
    setup({
      rbac: [null] as unknown as PolicyRule[],
    });

    const canMatch = await firstValueFrom(
      executeGuard(
        { data: { action: 'read', subject: 'Document' } } as never,
        [],
      ) as Observable<boolean>,
    );

    expect(canMatch).toBe(false);
  });
});
