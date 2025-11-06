import { InvalidatedTokenEntity } from './invalidated-token.entity';

describe('InvalidatedTokenEntity', () => {
  it('should be defined', () => {
    expect(new InvalidatedTokenEntity()).toBeDefined();
  });
  it('should create an InvalidatedTokenEntity with given properties', () => {
    const tokenProps = {
      userId: 'user123',
      tokenId: 'someInvalidatedTokenString',
    };
    const invalidatedTokenEntity = new InvalidatedTokenEntity(tokenProps);
    expect(invalidatedTokenEntity.userId).toBe(tokenProps.userId);
    expect(invalidatedTokenEntity.tokenId).toBe(tokenProps.tokenId);
  });
});
