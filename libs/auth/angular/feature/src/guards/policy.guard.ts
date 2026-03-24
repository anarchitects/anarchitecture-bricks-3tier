import { AuthStore } from '@anarchitects/auth-angular/state';
import { canAttemptRoutePolicy, RoutePolicy } from '@anarchitects/auth-ts/models';
import { inject, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanMatchFn } from '@angular/router';
import { filter, map, of, take } from 'rxjs';

const waitForAuthInitialization = (initialized: Signal<boolean>) => {
  if (initialized()) {
    return of(true);
  }

  return toObservable(initialized).pipe(filter(Boolean), take(1));
};

export const policyGuard: CanMatchFn = (route) => {
  const routePolicy = route.data as RoutePolicy;
  const authStore = inject(AuthStore);

  return waitForAuthInitialization(authStore.initialized).pipe(
    map(() => canAttemptRoutePolicy(routePolicy, authStore.rbac())),
  );
};
