import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthUser, Permission, PolicyRule, Role } from '@anarchitects/auth-ts';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { PoliciesService } from './policies.service';
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
  const mockAuthUser: AuthUser = {
    id: 'user-1',
    roles: [mockRole],
    email: '',
    name: null,
    emailVerified: false,
    image: null,
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

  const malformedPermissions: Array<{
    description: string;
    permission: Partial<Permission>;
  }> = [
    {
      description: 'empty action',
      permission: { action: '' },
    },
    {
      description: 'missing subject',
      permission: { subject: undefined },
    },
    {
      description: 'non-object conditions',
      permission: {
        conditions: [] as unknown as Record<string, unknown>,
      },
    },
    {
      description: 'invalid fields payload',
      permission: { fields: 'title' as unknown as string[] },
    },
    {
      description: 'non-boolean inverted',
      permission: { inverted: 'true' as unknown as boolean },
    },
    {
      description: 'non-string reason',
      permission: { reason: 123 as unknown as string },
    },
  ];

  const mockAuthUserRepository = {
    findOne: jest.fn().mockResolvedValue(mockAuthUser),
  };

  const mockAbilityFactory = {
    buildAbility: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuthUserRepository.findOne.mockResolvedValue(mockAuthUser);

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
  describe('rulesForAuthUser', () => {
    it('should return permissions for the auth user', async () => {
      const permissions = await service.rulesForAuthUser(mockAuthUser);
      expect(permissions).toEqual(expectedPolicyRules);
    });

    it.each(malformedPermissions)(
      'should fail closed on malformed persisted policy rules: $description',
      async ({ permission }) => {
        mockAuthUserRepository.findOne.mockResolvedValueOnce({
          ...mockAuthUser,
          roles: [
            {
              ...mockRole,
              permissions: [
                {
                  ...mockPermission,
                  ...permission,
                },
              ],
            },
          ],
        });

        await expect(service.rulesForAuthUser(mockAuthUser)).rejects.toThrow(
          InternalServerErrorException,
        );
      },
    );
  });

  describe('buildAbilityForAuthUser', () => {
    it('should build ability for the auth user', async () => {
      const ability = await service.buildAbilityForAuthUser(mockAuthUser);
      expect(mockAbilityFactory.buildAbility).toHaveBeenCalledWith(
        expectedPolicyRules,
      );
      expect(ability).toEqual({});
    });
  });

  describe('assertCanAttemptRoutePolicies', () => {
    it('allows a coarse route pass when a persisted rule matches', async () => {
      await expect(
        service.assertCanAttemptRoutePoliciesForAuthUser(mockAuthUser, [
          { action: 'read', subject: 'Article' },
        ]),
      ).resolves.toBeUndefined();
    });

    it('forbids a coarse route pass when no persisted rule matches', async () => {
      await expect(
        service.assertCanAttemptRoutePoliciesForAuthUser(mockAuthUser, [
          { action: 'delete', subject: 'Article' },
        ]),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
