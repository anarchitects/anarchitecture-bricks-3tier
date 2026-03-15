import { FormConfig } from '@anarchitects/forms-ts';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { AnarchitectsUiForm } from './form';

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
        label: 'Consent',
        placeholder: 'I agree to the terms and conditions',
      },
    },
  ],
};

export const Primary: Story = {
  args: {
    config: mockFormConfig,
  },
  play: async ({ canvas }) => {
    expect(await canvas.findByLabelText(/name/i)).toBeTruthy();
    expect(await canvas.findByLabelText(/email/i)).toBeTruthy();
    expect(await canvas.findByLabelText(/message/i)).toBeTruthy();
    expect(
      await canvas.findByRole('checkbox', { name: /consent/i }),
    ).toBeTruthy();

    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  },
};

export const InvalidEmailKeepsFormInvalid: Story = {
  args: {
    config: mockFormConfig,
  },
  play: async ({ canvas }) => {
    await userEvent.type(await canvas.findByLabelText(/name/i), 'Jane Doe');
    await userEvent.type(
      await canvas.findByLabelText(/email/i),
      'invalid-email',
    );
    await userEvent.type(
      await canvas.findByLabelText(/message/i),
      'Hello from Storybook',
    );
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: /consent/i }),
    );

    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  },
};

export const SuccessfulSubmitResetsFields: Story = {
  args: {
    config: mockFormConfig,
  },
  play: async ({ canvas }) => {
    const nameInput = (await canvas.findByLabelText(
      /name/i,
    )) as HTMLInputElement;
    const emailInput = (await canvas.findByLabelText(
      /email/i,
    )) as HTMLInputElement;
    const messageInput = (await canvas.findByLabelText(
      /message/i,
    )) as HTMLTextAreaElement;
    const consentCheckbox = (await canvas.findByRole('checkbox', {
      name: /consent/i,
    })) as HTMLInputElement;

    await userEvent.type(nameInput, 'Jane Doe');
    await userEvent.type(emailInput, 'jane.doe@example.com');
    await userEvent.type(messageInput, 'Hello from Storybook');
    await userEvent.click(consentCheckbox);
    await userEvent.click(
      await canvas.findByRole('button', { name: /submit/i }),
    );

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(messageInput.value).toBe('');
      expect(consentCheckbox.checked).toBe(false);
    });
  },
};
