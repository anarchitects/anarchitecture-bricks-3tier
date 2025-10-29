import { FormatRegistry } from '@sinclair/typebox';

FormatRegistry.Set('email', (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  // Basic RFC 5322 compliant email pattern sufficient for schema validation.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(value);
});
