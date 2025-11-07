import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from './ability.factory';
import { PolicyRule } from '@anarchitects/auth-ts';

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
    }
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
    it('should create abilities for a user', () => {
      const ability = abilityFactory.buildAbility(mockPolicyRules);
      expect(ability).toBeDefined();
      expect(ability.can('create', 'Article')).toBe(true);
      expect(ability.can('update', 'Article')).toBe(true);
      expect(ability.can('delete', 'Comment')).toBe(false);
    });
  });
});
