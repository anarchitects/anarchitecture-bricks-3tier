import { describe, expect, it } from 'vitest';
import { PublicFormDefinitionEnvelopeResponseSchema } from '@anarchitects/forms-contracts';
import {
  toFormDeliveryStatusDTO,
  toPublicFormDefinitionEnvelopeResponseDTO,
} from './public-form-definition.mapper';
import type { FormConfig } from '../models';

const config: FormConfig = {
  id: 'contact',
  version: 1,
  fields: [
    { name: 'email', kind: 'email', required: true, ui: { label: 'Email' } },
  ],
  delivery: {
    adminEmail: 'admin@example.test',
    webhooks: [
      { url: 'https://credential@example.test', secret: 'private-key' },
    ],
  },
};
it('projects a canonical public DTO without unknown nested metadata or delivery', () => {
  const polluted = {
    ...config,
    fields: [
      {
        ...config.fields[0],
        delivery: config.delivery,
        ui: { ...config.fields[0].ui, secret: 'private-key' },
      },
    ],
  };
  const result = toPublicFormDefinitionEnvelopeResponseDTO({
    config: polluted,
  });
  const json = JSON.parse(JSON.stringify(result));
  expect(
    PublicFormDefinitionEnvelopeResponseSchema.safeParse(json).success,
  ).toBe(true);
  expect(JSON.stringify(json)).not.toMatch(
    /private-key|credential|admin@example|delivery/,
  );
  expect(config.delivery?.webhooks?.[0].secret).toBe('private-key');
});
describe('restricted management indicator', () => {
  it('reports presence without echoing credentials', () => {
    expect(toFormDeliveryStatusDTO(config)).toEqual({ configured: true });
    expect(toFormDeliveryStatusDTO({ ...config, delivery: undefined })).toEqual(
      { configured: false },
    );
  });
});
