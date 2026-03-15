import { FormConfig } from '@anarchitects/forms-ts';
import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { AnarchitectsFeatureForm } from './form';

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

const getFormDefinitionMock = {
  url: `/api/forms/${formId}?formVersion=${formVersion}`,
  method: 'GET',
  status: 200,
  response: {
    config: mockFormConfig,
    schema: {},
  },
};

const submitFormMock = {
  url: '/api/forms/submit',
  method: 'POST',
  status: 201,
  response: {
    id: 'submission-1',
    formId,
    formVersion,
    payload: {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      message: 'Hello from Storybook',
      consent: true,
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
};

export const Primary: Story = {
  args: {
    formId: formId,
    formVersion: formVersion,
  },
  parameters: {
    mockData: [getFormDefinitionMock],
  },
  play: async ({ canvas }) => {
    expect(await canvas.findByLabelText(/name/i)).toBeTruthy();
    expect(await canvas.findByLabelText(/email/i)).toBeTruthy();
    expect(await canvas.findByLabelText(/message/i)).toBeTruthy();
    expect(
      await canvas.findByRole('checkbox', { name: /consent/i }),
    ).toBeTruthy();

    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    await expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  },
};

export const InvalidEmailKeepsFormInvalid: Story = {
  args: {
    formId: formId,
    formVersion: formVersion,
  },
  parameters: {
    mockData: [getFormDefinitionMock],
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
    await expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  },
};

export const SuccessfulSubmitShowsThankYouMessage: Story = {
  args: {
    formId: formId,
    formVersion: formVersion,
  },
  parameters: {
    mockData: [getFormDefinitionMock, submitFormMock],
  },
  play: async ({ canvas }) => {
    await userEvent.type(await canvas.findByLabelText(/name/i), 'Jane Doe');
    await userEvent.type(
      await canvas.findByLabelText(/email/i),
      'jane.doe@example.com',
    );
    await userEvent.type(
      await canvas.findByLabelText(/message/i),
      'Hello from Storybook',
    );
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: /consent/i }),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: /submit/i }),
    );

    await waitFor(() => {
      expect(canvas.getByText(/thanks for contacting us/i)).toBeTruthy();
    });
  },
};
