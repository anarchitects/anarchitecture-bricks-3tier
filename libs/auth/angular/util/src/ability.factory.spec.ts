import { PolicyRule } from '@anarchitects/auth-ts/models';
import { subject } from '@casl/ability';
import {
  canAccessResource,
  canAccessResourceField,
  createAppAbility,
} from './ability.factory';

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

  it('supports field-scoped checks for concrete resources', () => {
    const rules: PolicyRule[] = [
      { action: 'update', subject: 'Post', fields: ['title'] },
    ];

    const ability = createAppAbility(rules);
    const post = { id: 'post-1', authorId: 'user-1' };

    expect(canAccessResourceField(ability, 'update', 'Post', 'title', post)).toBe(
      true,
    );
    expect(canAccessResourceField(ability, 'update', 'Post', 'body', post)).toBe(
      false,
    );
  });

  it('supports concrete resource ownership checks', () => {
    const rules: PolicyRule[] = [
      {
        action: 'update',
        subject: 'Post',
        conditions: { authorId: 'user-1' },
      },
    ];

    const ability = createAppAbility(rules);

    expect(
      canAccessResource(ability, 'update', 'Post', {
        id: 'post-1',
        authorId: 'user-1',
      }),
    ).toBe(true);
    expect(
      canAccessResource(ability, 'update', 'Post', {
        id: 'post-2',
        authorId: 'user-2',
      }),
    ).toBe(false);
  });

  it('applies inverted rules to concrete resources', () => {
    const rules: PolicyRule[] = [
      { action: 'update', subject: 'Post' },
      {
        action: 'update',
        subject: 'Post',
        conditions: { archived: true },
        inverted: true,
      },
    ];

    const ability = createAppAbility(rules);

    expect(
      ability.can('update', subject('Post', { id: 'post-1', archived: false })),
    ).toBe(true);
    expect(
      ability.can('update', subject('Post', { id: 'post-2', archived: true })),
    ).toBe(false);
  });

  it('fails closed when malformed rules are provided', () => {
    const ability = createAppAbility([null] as unknown as PolicyRule[]);

    expect(ability.can('read', 'Post')).toBe(false);
  });

  it('returns false for malformed concrete resource inputs', () => {
    const ability = createAppAbility([{ action: 'read', subject: 'Post' }]);

    expect(
      canAccessResource(
        ability,
        'read',
        'Post',
        null as unknown as Record<string, unknown>,
      ),
    ).toBe(false);
    expect(
      canAccessResourceField(
        ability,
        'read',
        'Post',
        'title',
        null as unknown as Record<string, unknown>,
      ),
    ).toBe(false);
  });
});
