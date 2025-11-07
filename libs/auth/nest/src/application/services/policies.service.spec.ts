import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesService } from './policies.service';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { Permission, PolicyRule, Role, User } from '@anarchitects/auth-ts';
import { AbilityFactory } from '../factories/ability.factory';

describe('PoliciesService', () => {
  let service: PoliciesService;
  const mockPermission: Permission = {
    action: 'read',
    subject: 'Article',
    id: '',
    name: '',
    description: null,
    conditions: null,
    fields: null,
    inverted: false,
    reason: null,
    roles: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockRole: Role = {
    name: 'admin',
    permissions: [mockPermission],
    id: '',
    description: null,
    users: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockUser: User = {
    id: 'user-1',
    roles: [mockRole],
    email: '',
    userName: null,
    passwordHash: '',
    token: null,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const expectedPolicyRules: PolicyRule[] = [
    {
      action: 'read',
      subject: 'Article',
      conditions: undefined,
      fields: undefined,
      reason: undefined,
      inverted: false,
    },
  ];

  const mockAuthUserRepository = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  const mockAbilityFactory = {
    buildAbility: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: AbilityFactory, useValue: mockAbilityFactory },
      ],
    }).compile();

    service = module.get<PoliciesService>(PoliciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('rulesForUser', () => {
    it('should return permissions for the user', async () => {
      const permissions = await service.rulesForUser(mockUser);
      expect(permissions).toEqual(expectedPolicyRules);
    });
  });

  describe('buildAbilityForUser', () => {
    it('should build ability for the user', async () => {
      const ability = await service.buildAbilityForUser(mockUser);
      expect(mockAbilityFactory.buildAbility).toHaveBeenCalledWith(expectedPolicyRules);
      expect(ability).toEqual({});
    });
  });
});
