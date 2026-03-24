# @anarchitects/auth-angular/util

Utility layer for Angular auth. Re-exported via `@anarchitects/auth-angular/util`, it centralises CASL ability helpers that are consumed by the feature and state slices.

## Exports

- `createAppAbility(rules: PolicyRule[])`: wraps `createMongoAbility` and returns the typed `AppAbility` used throughout the auth domain.
- `canAccessResource(...)`: checks a concrete resource instance against the current ability.
- `canAccessResourceField(...)`: checks whether a specific field-level action is allowed for a concrete resource.
- `AppAbility`: CASL ability type configured for `Action`/`Subject` pairs defined in `@anarchitects/auth-ts/models`.

## Usage

```ts
import {
  canAccessResource,
  canAccessResourceField,
  createAppAbility,
} from '@anarchitects/auth-angular/util';
import type { PolicyRule } from '@anarchitects/auth-ts/models';

const rules: PolicyRule[] = [
  { action: 'read', subject: 'profile' },
  { action: 'manage', subject: 'Project', conditions: { ownerId: 1 } },
];

const ability = createAppAbility(rules);

if (ability.can('manage', 'Project')) {
  // guarded feature logic
}

const post = { id: 'post-1', authorId: 'user-1', title: 'Draft' };

if (canAccessResource(ability, 'update', 'Post', post)) {
  // show edit button
}

if (canAccessResourceField(ability, 'update', 'Post', 'title', post)) {
  // allow inline title editing
}
```

Use these helpers for frontend instance-level decisions such as edit buttons, row actions, and resolved edit routes. Coarse route gating still belongs to `policyGuard`, and the backend must still enforce the final instance-level decision.
