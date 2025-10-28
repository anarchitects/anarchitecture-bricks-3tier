import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsFeatureForm } from './form';
import { expect } from 'storybook/test';
import { FormConfig } from '@anarchitects/forms-ts';

const meta: Meta<AnarchitectsFeatureForm> = {
  component: AnarchitectsFeatureForm,
  title: 'AnarchitectsFeatureForm',
};
export default meta;

type Story = StoryObj<AnarchitectsFeatureForm>;

const formId = 'contact-form';
const formVersion = 1;

const mockFormConfig: FormConfig = {
  id: formId,
  version: formVersion,
  fields: [
    {
      name: 'name',
      kind: 'string',
      required: true,
      ui: {
        label: 'Name',
        placeholder: 'Enter your name',
      },
    },
    {
      name: 'email',
      kind: 'email',
      required: true,
      ui: {
        label: 'Email',
        placeholder: 'Enter your email',
      },
    },
    {
      name: 'message',
      kind: 'textarea',
      required: true,
      ui: {
        label: 'Message',
        placeholder: 'Enter your message',
        rows: 5,
      },
    },
    {
      name: 'consent',
      kind: 'boolean',
      required: true,
      ui: {
        label: 'Consent',
        placeholder: 'I agree to the terms and conditions',
      },
    },
  ],
};

export const Primary: Story = {
  args: {
    formId: formId,
    formVersion: formVersion,
  },
  parameters: {
    mockData: [
      {
        url: `/api/forms/${formId}`,
        method: 'GET',
        status: 200,
        response: {
          config: mockFormConfig,
          schema: {},
        },
      },
    ],
  },
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/form/gi)).toBeTruthy();
  },
};
