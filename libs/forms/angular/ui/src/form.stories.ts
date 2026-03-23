import { FormConfig } from '@anarchitects/forms-ts';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { ValidatorFn } from '@angular/forms';
import { expect, userEvent, waitFor } from 'storybook/test';
import { AnarchitectsUiForm } from './form';

const meta: Meta<AnarchitectsUiForm> = {
  component: AnarchitectsUiForm,
  title: 'Forms UI/Form',
  decorators: [
    moduleMetadata({
      imports: [AnxTemplateDirective],
    }),
  ],
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

const passwordValidationConfig: FormConfig = {
  id: 'register-form',
  version: 1,
  fields: [
    {
      name: 'password',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: {
        label: 'Password',
      },
    },
    {
      name: 'confirmPassword',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: {
        label: 'Confirm Password',
      },
    },
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

const blockedEmailValidator: ValidatorFn = (control) =>
  control.get('email')?.value === 'blocked@example.com'
    ? { runtimeBlocked: true }
    : null;

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

export const GridLayout: Story = {
  args: {
    config: mockFormConfig,
    layout: 'form:grid',
    layoutOptions: { columns: 2 },
  },
};

export const TemplateOverride: Story = {
  args: {
    config: mockFormConfig,
    layout: 'form:stacked',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-ui-form [config]="config" [layout]="layout">
        <ng-template anxTemplate="field" let-field>
          <section class="anx-stack" style="gap: .25rem;">
            <strong>Custom field template: {{ field.ui?.label ?? field.name }}</strong>
            <span>Render your own control composition here.</span>
          </section>
        </ng-template>
      </anarchitects-forms-ui-form>
    `,
  }),
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

export const CrossFieldValidation: Story = {
  args: {
    config: passwordValidationConfig,
  },
  play: async ({ canvas }) => {
    await userEvent.type(
      await canvas.findByLabelText(/^password$/i),
      'secret123',
    );
    await userEvent.type(
      await canvas.findByLabelText(/confirm password/i),
      'secret124',
    );

    expect(await canvas.findByText(/passwords must match/i)).toBeTruthy();
  },
};

export const RuntimeValidators: Story = {
  args: {
    config: mockFormConfig,
    runtimeValidators: [blockedEmailValidator],
  },
  play: async ({ canvas }) => {
    await userEvent.type(await canvas.findByLabelText(/name/i), 'Jane Doe');
    await userEvent.type(
      await canvas.findByLabelText(/email/i),
      'blocked@example.com',
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
