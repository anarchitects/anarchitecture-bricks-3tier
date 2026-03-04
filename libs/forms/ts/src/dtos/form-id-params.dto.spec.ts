import { Value } from '@sinclair/typebox/value';
import { FormIdParamsSchema } from './form-id-params.dto';

describe('FormIdParamsSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(FormIdParamsSchema, payload),
  ];

  it('accepts valid route params', () => {
    expect(validate({ formId: 'contact_default' })).toHaveLength(0);
  });

  it('requires formId', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects non-string formId', () => {
    expect(validate({ formId: 123 })).not.toHaveLength(0);
  });
});
