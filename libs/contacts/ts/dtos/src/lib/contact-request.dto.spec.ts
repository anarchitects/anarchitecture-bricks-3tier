import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { ContactRequestDto, ContactRequestSchema } from './contact-request.dto';

const validContactRequest: ContactRequestDto = {
  name: 'Ada Lovelace',
  email: 'ada.lovelace@example.com',
  message: 'Count me in for the next release.',
};

FormatRegistry.Set(
  'email',
  (value: unknown): boolean =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
);

describe('ContactRequestSchema', () => {
  it('accepts a valid contact request payload', () => {
    expect(Value.Check(ContactRequestSchema, validContactRequest)).toBe(true);
    expect([
      ...Value.Errors(ContactRequestSchema, validContactRequest),
    ]).toHaveLength(0);
  });

  it('rejects an empty name', () => {
    const candidate = { ...validContactRequest, name: '' };
    const errors = [...Value.Errors(ContactRequestSchema, candidate)];

    expect(errors.length).toBeGreaterThan(0);
    expect(Value.Check(ContactRequestSchema, candidate)).toBe(false);
  });

  it('rejects an invalid email format', () => {
    const candidate = { ...validContactRequest, email: 'not-an-email' };
    expect(Value.Check(ContactRequestSchema, candidate)).toBe(false);
    expect(
      [...Value.Errors(ContactRequestSchema, candidate)].length
    ).toBeGreaterThan(0);
  });

  it('rejects a message longer than 1000 characters', () => {
    const candidate = {
      ...validContactRequest,
      message: 'a'.repeat(1001),
    };

    expect(Value.Check(ContactRequestSchema, candidate)).toBe(false);
    expect(
      [...Value.Errors(ContactRequestSchema, candidate)].length
    ).toBeGreaterThan(0);
  });

  it('exposes the expected TypeScript shape', () => {
    expectTypeOf(validContactRequest).toMatchTypeOf<ContactRequestDto>();
  });
});
