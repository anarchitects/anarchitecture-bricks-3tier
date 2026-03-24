import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from '../factories/ability.factory';
import {
  assertCanAccessResource,
  toPolicySubject,
} from './resource-authorization';

describe('resource authorization', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('allows access to a matching instance after a coarse route check', () => {
    const ability = abilityFactory.buildAbility([
      {
        action: 'update',
        subject: 'Post',
        conditions: { authorId: 'user-1' },
      },
    ]);

    expect(() =>
      assertCanAccessResource(ability, 'update', 'Post', {
        id: 'post-1',
        authorId: 'user-1',
      }),
    ).not.toThrow();
  });

  it('denies access to a non-matching instance after a coarse route check', () => {
    const ability = abilityFactory.buildAbility([
      {
        action: 'update',
        subject: 'Post',
        conditions: { authorId: 'user-1' },
      },
    ]);

    expect(() =>
      assertCanAccessResource(ability, 'update', 'Post', {
        id: 'post-2',
        authorId: 'user-2',
      }),
    ).toThrow(ForbiddenException);
  });

  it('supports field-scoped checks on a concrete resource', () => {
    const ability = abilityFactory.buildAbility([
      {
        action: 'read',
        subject: 'Post',
        fields: ['title'],
      },
    ]);

    expect(
      ability.can('read', toPolicySubject('Post', { id: 'post-1' }), 'title'),
    ).toBe(true);
    expect(
      ability.can('read', toPolicySubject('Post', { id: 'post-1' }), 'body'),
    ).toBe(false);
  });
});
