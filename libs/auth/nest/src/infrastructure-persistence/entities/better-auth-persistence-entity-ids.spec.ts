import { PasskeyEntity } from '../../infrastructure-engine/better-auth/plugins/passkeys/passkey.entity';
import { AccountEntity } from './account.entity';
import { SessionEntity } from './session.entity';
import { VerificationEntity } from './verification.entity';

describe('Better Auth persistence entity ids', () => {
  it.each([
    ['account', new AccountEntity()],
    ['session', new SessionEntity()],
    ['verification', new VerificationEntity()],
    ['passkey', new PasskeyEntity()],
  ])('generates an id for %s entities before insert', (_label, entity) => {
    expect(entity.id).toBeUndefined();

    entity.generateId();

    expect(entity.id).toEqual(expect.any(String));
    expect(entity.id).toHaveLength(36);
  });

  it.each([
    ['account', Object.assign(new AccountEntity(), { id: 'existing-id' })],
    ['session', Object.assign(new SessionEntity(), { id: 'existing-id' })],
    [
      'verification',
      Object.assign(new VerificationEntity(), { id: 'existing-id' }),
    ],
    ['passkey', Object.assign(new PasskeyEntity(), { id: 'existing-id' })],
  ])('preserves an existing id for %s entities', (_label, entity) => {
    entity.generateId();

    expect(entity.id).toBe('existing-id');
  });
});
