import type { ValueTransformer } from 'typeorm';

function assertCounter(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Passkey counter must be an unsigned 32-bit integer.');
  }
  return value;
}

// PostgreSQL bigint is returned as a string; every uint32 is exact as a JS number.
export const passkeyCounterTransformer: ValueTransformer = {
  to: (value: number): number => assertCounter(value),
  from: (value: string | number): number => assertCounter(Number(value)),
};
