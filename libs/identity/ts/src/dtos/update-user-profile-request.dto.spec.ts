import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { UpdateUserProfileRequestSchema } from './update-user-profile-request.dto';

describe('UpdateUserProfileRequestSchema', () => {
  it('does not require authUserId for profile updates', () => {
    expect(UpdateUserProfileRequestSchema.required).toBeUndefined();
  });

  it('validates a partial update payload', () => {
    expect([
      ...Value.Errors(UpdateUserProfileRequestSchema, {
        displayName: 'Updated Name',
      }),
    ]).toStrictEqual([]);
  });

  it('allows nullable fields when clearing profile values', () => {
    expect([
      ...Value.Errors(UpdateUserProfileRequestSchema, {
        displayName: null,
        avatarUrl: null,
      }),
    ]).toStrictEqual([]);
  });
});
