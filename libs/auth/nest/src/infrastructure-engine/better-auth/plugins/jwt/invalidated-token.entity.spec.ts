import { InvalidatedTokenEntity } from './invalidated-token.entity';

describe('InvalidatedTokenEntity', () => {
  it('is defined', () => {
    expect(new InvalidatedTokenEntity()).toBeDefined();
  });

  it('creates an invalidated token entity with given properties', () => {
    const tokenProps = {
      tokenId: 'hashed-token',
      userId: 'user-id',
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
    };

    const invalidatedTokenEntity = new InvalidatedTokenEntity(tokenProps);

    expect(invalidatedTokenEntity).toMatchObject(tokenProps);
  });
});
