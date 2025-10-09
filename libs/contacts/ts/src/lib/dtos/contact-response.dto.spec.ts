import { Value } from '@sinclair/typebox/value';
import { ContactResponseSchema } from './contact-response.dto';

describe('ContactResponseSchema', () => {
  it('accepts a payload with a boolean success flag', () => {
    const candidate = { success: true };

    expect(Value.Check(ContactResponseSchema, candidate)).toBe(true);
    expect([...Value.Errors(ContactResponseSchema, candidate)]).toHaveLength(0);
  });

  it('rejects payloads without the success flag', () => {
    const errors = [...Value.Errors(ContactResponseSchema, {})];

    expect(errors.length).toBeGreaterThan(0);
    expect(Value.Check(ContactResponseSchema, {})).toBe(false);
  });

  it('rejects a non-boolean success flag', () => {
    const candidate = { success: 'yes' };

    expect(Value.Check(ContactResponseSchema, candidate)).toBe(false);
    expect(
      [...Value.Errors(ContactResponseSchema, candidate)].length
    ).toBeGreaterThan(0);
  });
});
