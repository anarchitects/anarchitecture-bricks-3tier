import { CryptoNativeToken } from './crypto-native-token';

describe('CryptoNativeToken', () => {
  const tokens = new CryptoNativeToken();
  it('issues unique 256-bit tokens and opaque verifiers with purpose separation', () => {
    const first = tokens.issue('confirm');
    const second = tokens.issue('confirm');
    const unsubscribe = tokens.issue('unsubscribe');
    expect(first.secret).toMatch(/^v1\.c\.[A-Za-z0-9_-]{43}$/);
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.secret).not.toBe(second.secret);
    expect(first.hash).not.toBe(second.hash);
    expect(tokens.hash(first.secret, 'confirm')).toBe(first.hash);
    expect(tokens.hash(first.secret, 'unsubscribe')).toBeUndefined();
    expect(tokens.hash(unsubscribe.secret, 'confirm')).toBeUndefined();
    expect(tokens.hash(unsubscribe.secret, 'unsubscribe')).toBe(
      unsubscribe.hash,
    );
  });
  it.each([
    undefined,
    null,
    {},
    '',
    'v1.c.' + 'a'.repeat(42),
    'v2.c.' + 'a'.repeat(43),
    'v1.c.' + 'a'.repeat(43) + '\n',
    'x'.repeat(10000),
  ])('rejects malformed secrets without hashing: %p', (value) => {
    expect(tokens.hash(value, 'confirm')).toBeUndefined();
  });
});
