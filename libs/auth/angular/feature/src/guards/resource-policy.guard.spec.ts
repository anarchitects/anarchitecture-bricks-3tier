import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { createAppAbility } from '@anarchitects/auth-angular/util';
import { PolicyRule } from '@anarchitects/auth-ts/models';
import { resourcePolicyGuard } from './resource-policy.guard';

describe('resourcePolicyGuard', () => {
  const executeGuard = (...guardParameters: Parameters<typeof resourcePolicyGuard>) =>
    TestBed.runInInjectionContext(() => resourcePolicyGuard(...guardParameters));

  const setup = ({
    initialized = true,
    rbac = [],
  }: {
    initialized?: boolean;
    rbac?: PolicyRule[];
  } = {}) => {
    const initializedSignal = signal(initialized);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            ability: signal(createAppAbility(rbac)),
            initialized: initializedSignal,
            rbac: signal(rbac),
          },
        },
      ],
    });

    return {
      initializedSignal,
      router: TestBed.inject(Router),
    };
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows access to an owned post edit route', async () => {
    setup({
      rbac: [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ],
    });

    const result = await firstValueFrom(
      executeGuard(
        {
          data: {
            action: 'update',
            resourceKey: 'post',
            subject: 'Post',
            post: { id: 'post-1', authorId: 'user-1' },
          },
        } as never,
        { url: '/posts/post-1/edit' } as never,
      ) as Observable<boolean | UrlTree>,
    );

    expect(result).toBe(true);
  });

  it('redirects for a non-owned post edit route', async () => {
    const { router } = setup({
      rbac: [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ],
    });

    const result = await firstValueFrom(
      executeGuard(
        {
          data: {
            action: 'update',
            resourceKey: 'post',
            subject: 'Post',
            post: { id: 'post-1', authorId: 'user-2' },
          },
        } as never,
        { url: '/posts/post-1/edit' } as never,
      ) as Observable<boolean | UrlTree>,
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/posts/post-1');
  });

  it('prefers the explicit unauthorized redirect target', async () => {
    const { router } = setup({
      rbac: [
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ],
    });

    const result = await firstValueFrom(
      executeGuard(
        {
          data: {
            action: 'update',
            resourceKey: 'post',
            subject: 'Post',
            post: { id: 'post-1', authorId: 'user-2' },
            unauthorizedRedirectTo: '/posts',
          },
        } as never,
        { url: '/posts/post-1/edit' } as never,
      ) as Observable<boolean | UrlTree>,
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/posts');
  });

  it('waits for auth initialization before resolving', async () => {
    const { initializedSignal } = setup({
      initialized: false,
      rbac: [{ action: 'read', subject: 'Post' }],
    });

    const resultPromise = firstValueFrom(
      executeGuard(
        {
          data: {
            action: 'read',
            resourceKey: 'post',
            subject: 'Post',
            post: { id: 'post-1' },
          },
        } as never,
        { url: '/posts/post-1' } as never,
      ) as Observable<boolean | UrlTree>,
    );

    initializedSignal.set(true);

    await expect(resultPromise).resolves.toBe(true);
  });
});
