import { passkeyCounterTransformer } from './passkey-counter.transformer';

describe('passkey counter persistence', () => {
  it.each([0, 1, 2147483647, 2147483648, 4294967295])(
    'round-trips %s without losing precision',
    (value) => {
      expect(passkeyCounterTransformer.to(value)).toBe(value);
      expect(passkeyCounterTransformer.from(String(value))).toBe(value);
    },
  );

  it.each([-1, 0.5, 4294967296, NaN, Infinity])(
    'rejects invalid stored or supplied counter %s',
    (value) => {
      expect(() => passkeyCounterTransformer.to(value)).toThrow(RangeError);
      expect(() => passkeyCounterTransformer.from(String(value))).toThrow(
        RangeError,
      );
    },
  );
});
