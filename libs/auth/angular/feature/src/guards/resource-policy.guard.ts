import { AuthStore } from '@anarchitects/auth-angular/state';
import { canAccessResource } from '@anarchitects/auth-angular/util';
import { Action, Subject } from '@anarchitects/auth-ts/models';
import { inject, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { filter, map, of, take } from 'rxjs';

type ResourcePolicyGuardData = {
  action: Action;
  subject: Subject;
  resourceKey: string;
  unauthorizedRedirectTo?: string | readonly unknown[];
};

const waitForAuthInitialization = (initialized: Signal<boolean>) => {
  if (initialized()) {
    return of(true);
  }

  return toObservable(initialized).pipe(filter(Boolean), take(1));
};

const stripTrailingSlashes = (value: string): string => {
  let end = value.length;

  while (end > 0 && value[end - 1] === '/') {
    end -= 1;
  }

  return value.slice(0, end);
};

const buildParentUrl = (state: RouterStateSnapshot): string => {
  const path = stripTrailingSlashes(state.url.split('?')[0]);
  const segments = path.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return '/';
  }

  return `/${segments.slice(0, -1).join('/')}`;
};

const resolveUnauthorizedRedirect = (
  routeData: ResourcePolicyGuardData,
  router: Router,
  state: RouterStateSnapshot,
): UrlTree => {
  if (Array.isArray(routeData.unauthorizedRedirectTo)) {
    return router.createUrlTree(routeData.unauthorizedRedirectTo);
  }

  if (typeof routeData.unauthorizedRedirectTo === 'string') {
    return router.parseUrl(routeData.unauthorizedRedirectTo);
  }

  return router.parseUrl(buildParentUrl(state));
};

export const resourcePolicyGuard: CanActivateFn = (route, state) => {
  const routeData = route.data as ResourcePolicyGuardData;
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return waitForAuthInitialization(authStore.initialized).pipe(
    map(() => {
      const ability = authStore.ability();
      const resource = route.data?.[routeData.resourceKey];

      if (
        !ability ||
        !resource ||
        typeof resource !== 'object' ||
        Array.isArray(resource) ||
        !canAccessResource(
          ability,
          routeData.action,
          routeData.subject,
          resource as Record<string, unknown>,
        )
      ) {
        return resolveUnauthorizedRedirect(routeData, router, state);
      }

      return true;
    }),
  );
};
