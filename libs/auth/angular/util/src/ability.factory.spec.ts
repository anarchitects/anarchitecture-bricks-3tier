import { PolicyRule } from '@anarchitects/auth-ts/models';
import { subject } from '@casl/ability';
import { createAppAbility } from './ability.factory';

const emptyRules: PolicyRule[] = [];

describe('Ability', () => {
  it('creates an ability instance', () => {
    expect(createAppAbility(emptyRules)).toBeTruthy();
  });

  it('grants actions defined in the policy rules', () => {
    const rules: PolicyRule[] = [{ action: 'read', subject: 'profile' }];

    const ability = createAppAbility(rules);

    expect(ability.can('read', 'profile')).toBe(true);
    expect(ability.can('update', 'profile')).toBe(false);
  });

  it('evaluates rule conditions against the provided subject context', () => {
    const rules: PolicyRule[] = [
      { action: 'manage', subject: 'Project', conditions: { ownerId: 1 } },
    ];

    const ability = createAppAbility(rules);

    const matchingProject = subject('Project', { ownerId: 1 });
    const otherProject = subject('Project', { ownerId: 2 });

    expect(ability.can('manage', matchingProject)).toBe(true);
    expect(ability.can('manage', otherProject)).toBe(false);
  });

  it('denies actions not covered by any policy rule', () => {
    const rules: PolicyRule[] = [{ action: 'read', subject: 'Document' }];

    const ability = createAppAbility(rules);

    expect(ability.can('delete', 'Document')).toBe(false);
    expect(ability.can('update', 'Document')).toBe(false);
  });

  it('handles inverted rules correctly', () => {
    const rules: PolicyRule[] = [
      { action: 'delete', subject: 'Comment', inverted: true },
    ];

    const ability = createAppAbility(rules);

    expect(ability.can('delete', 'Comment')).toBe(false);
  });
});
