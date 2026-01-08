import { AuthStore } from '@anarchitects/auth-angular/state';
import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';

export const policyGuard: CanMatchFn = (route) => {
  const { action, subject } = route.data as {
    action: string;
    subject: string;
  };
  const authStore = inject(AuthStore);
  const ability = authStore.ability?.();

  if (!ability) {
    return false;
  }

  return ability.can(action, subject);
};
