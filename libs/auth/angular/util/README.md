# @anarchitects/auth-angular/util

Utility layer for Angular auth. Re-exported via `@anarchitects/auth-angular/util`, it centralises CASL ability helpers that are consumed by the feature and state slices.

## Exports

- `createAppAbility(rules: PolicyRule[])`: wraps `createMongoAbility` and returns the typed `AppAbility` used throughout the auth domain.
- `AppAbility`: CASL ability type configured for `Action`/`Subject` pairs defined in `@anarchitects/auth-ts/models`.

## Usage

```ts
import { createAppAbility } from '@anarchitects/auth-angular/util';
import type { PolicyRule } from '@anarchitects/auth-ts/models';

const rules: PolicyRule[] = [
  { action: 'read', subject: 'profile' },
  { action: 'manage', subject: 'Project', conditions: { ownerId: 1 } },
];

const ability = createAppAbility(rules);

if (ability.can('manage', 'Project')) {
  // guarded feature logic
}
```

For stateful orchestration examples, see `auth.store` in the state layer where the ability factory is integrated with the auth API responses.
