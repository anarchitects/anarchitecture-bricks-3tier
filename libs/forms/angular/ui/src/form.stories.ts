import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiForm } from './form';
import { expect } from 'storybook/test';
import { FormConfig } from '@anarchitects/forms-ts';

const meta: Meta<AnarchitectsUiForm> = {
  component: AnarchitectsUiForm,
  title: 'AnarchitectsUiForm',
};
export default meta;

type Story = StoryObj<AnarchitectsUiForm>;

const mockFormConfig: FormConfig = {
  id: 'contact-form',
  version: 1,
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
        label: 'I agree to the terms and conditions',
      },
    },
  ],
};

export const Primary: Story = {
  args: {
    config: mockFormConfig,
  },
};
