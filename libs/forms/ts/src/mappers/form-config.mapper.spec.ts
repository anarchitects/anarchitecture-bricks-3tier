import { fromFormDefinitionResponseDTO, toFormDefinitionResponseDTO } from '.';
import { FormConfig } from '../models';

describe('form-config mapper', () => {
  it('preserves validationRules through DTO round-trip', () => {
    const model: FormConfig = {
      id: 'register',
      version: 1,
      fields: [
        { name: 'password', kind: 'password', required: true },
        { name: 'confirmPassword', kind: 'password', required: true },
      ],
      validationRules: [
        {
          kind: 'matchFields',
          sourceField: 'password',
          targetField: 'confirmPassword',
          message: 'Passwords must match.',
        },
      ],
    };

    const dto = toFormDefinitionResponseDTO(model);

    expect(fromFormDefinitionResponseDTO(dto)).toEqual(model);
  });
});
