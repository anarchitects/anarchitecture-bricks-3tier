import { faker } from '@faker-js/faker';
import { FormConfigEntity } from './form-config.entity';

describe('FormConfigEntity', () => {
  const mockConfig = {
    id: faker.string.alphanumeric(12),
    version: 1,
    fields: [{ name: 'email', kind: 'email' as const, required: true }],
    validationRules: [
      {
        kind: 'matchFields' as const,
        sourceField: 'password',
        targetField: 'confirmPassword',
        message: 'Passwords must match.',
      },
    ],
    security: { captcha: 'none' as const },
  };

  it('should be defined', () => {
    expect(new FormConfigEntity(mockConfig)).toBeDefined();
  });

  it('should create an instance with given partial data', () => {
    const entity = new FormConfigEntity(mockConfig);
    expect(entity).toMatchObject(mockConfig);
  });
});
