import { Test, TestingModule } from '@nestjs/testing';
import { PolicyRule } from '@anarchitects/auth-ts';
import { subject } from '@casl/ability';
import { AbilityFactory } from './ability.factory';

describe('AbilityFactory', () => {
  let abilityFactory: AbilityFactory;

  const mockPolicyRules: PolicyRule[] = [
    {
      action: 'create',
      subject: 'Article',
      conditions: {},
      inverted: false,
    },
    {
      action: 'update',
      subject: 'Article',
      conditions: { authorId: 'user-123' },
      inverted: false,
    },
    {
      action: 'delete',
      subject: 'Comment',
      conditions: {},
      inverted: true,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should be defined', () => {
    expect(abilityFactory).toBeDefined();
  });
  describe('buildAbility', () => {
    it('should create abilities for unconditional, conditional, and inverted rules', () => {
      const ability = abilityFactory.buildAbility(mockPolicyRules);
      expect(ability).toBeDefined();
      expect(ability.can('create', 'Article')).toBe(true);
      expect(
        ability.can('update', subject('Article', { authorId: 'user-123' })),
      ).toBe(true);
      expect(
        ability.can('update', subject('Article', { authorId: 'other-user' })),
      ).toBe(false);
      expect(ability.can('delete', 'Comment')).toBe(false);
    });

    it('should enforce field-scoped permissions correctly', () => {
      const ability = abilityFactory.buildAbility([
        {
          action: 'read',
          subject: 'Article',
          fields: ['title'],
        },
      ]);

      const article = subject('Article', { id: 'article-1' });
      expect(ability.can('read', article, 'title')).toBe(true);
      expect(ability.can('read', article, 'body')).toBe(false);
    });
  });
});
