import { Provider } from '@angular/core';
import {
  IdentityConfig,
  provideIdentityConfig,
} from '@anarchitects/identity-angular/config';
import { provideIdentityDataAccess } from '@anarchitects/identity-angular/data-access';
import { provideIdentityState } from '@anarchitects/identity-angular/state';

export function provideIdentityFeature(
  config: Partial<IdentityConfig> = {},
): Provider[] {
  return [
    ...provideIdentityConfig(config),
    ...provideIdentityDataAccess(),
    ...provideIdentityState(),
  ];
}
