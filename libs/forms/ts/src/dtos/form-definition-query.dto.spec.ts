import { Value } from '@sinclair/typebox/value';
import { FormDefinitionQuerySchema } from './form-definition-query.dto';

describe('FormDefinitionQuerySchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(FormDefinitionQuerySchema, payload),
  ];

  it('accepts an empty query object', () => {
    expect(validate({})).toHaveLength(0);
  });

  it('accepts formVersion >= 1', () => {
    expect(validate({ formVersion: 1 })).toHaveLength(0);
    expect(validate({ formVersion: 99 })).toHaveLength(0);
  });

  it('rejects invalid formVersion values', () => {
    expect(validate({ formVersion: 0 })).not.toHaveLength(0);
    expect(validate({ formVersion: -1 })).not.toHaveLength(0);
    expect(validate({ formVersion: 1.5 })).not.toHaveLength(0);
    expect(validate({ formVersion: '1' })).not.toHaveLength(0);
  });
});
