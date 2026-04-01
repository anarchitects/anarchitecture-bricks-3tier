import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { FormConfig } from '@anarchitects/forms-ts';
import { ValidatorFn } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { AnarchitectsUiForm } from './form';

const meta: Meta<AnarchitectsUiForm> = {
  component: AnarchitectsUiForm,
  title: 'Forms UI/Form',
  decorators: [
    moduleMetadata({
      imports: [AnxTemplateDirective, AnxSlotDirective],
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

export const ContactPreset: Story = {
  args: {
    config: mockFormConfig,
    pagePreset: {
      layoutVariant: 'stacked',
      maxInlineSize: '42rem',
      spacing: 'comfortable',
      actionAlignment: 'end',
    },
  },
};

export const PresetGridCompact: Story = {
  args: {
    config: mockFormConfig,
    pagePreset: {
      layoutVariant: 'grid',
      columns: 2,
      maxInlineSize: '56rem',
      spacing: 'compact',
      actionAlignment: 'center',
    },
  },
};

export const ContactHeaderInputs: Story = {
  args: {
    config: mockFormConfig,
    pageTitle: 'Contact us!',
    pageCaption: 'Get in touch with us and we will get back to you ASAP.',
  },
};

export const SubtitleOnly: Story = {
  args: {
    config: mockFormConfig,
    pageSubtitle: 'Share your request and context in a few lines.',
  },
};

export const CaptionOnlyMultiline: Story = {
  args: {
    config: mockFormConfig,
    pageCaption:
      'Our team reviews every request carefully.\nPlease include expected timeline and contact preferences.',
  },
};

export const MultipleCaptionsTopAndBottom: Story = {
  args: {
    config: mockFormConfig,
    pageTitle: 'Contact support',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-ui-form [config]="config" [pageTitle]="pageTitle">
        <p anxSlot="app-forms-caption-top">Top caption 1: Product support</p>
        <p anxSlot="app-forms-caption-top">Top caption 2: Billing and accounts</p>

        <p anxSlot="app-forms-caption-bottom">Bottom caption 1: Mon-Fri, 08:00-18:00 CET</p>
        <p anxSlot="app-forms-caption-bottom">Bottom caption 2: Emergency channels are monitored 24/7</p>
      </anarchitects-forms-ui-form>
    `,
  }),
};

export const CustomHeaderSlotOverride: Story = {
  args: {
    config: mockFormConfig,
    pageTitle: 'This title should be replaced',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-ui-form [config]="config" [pageTitle]="pageTitle">
        <header anxSlot="app-forms-page-header" class="anx-stack" style="gap: .25rem;">
          <h1>Custom projected header</h1>
          <p>Use this region for fully bespoke page-intro composition.</p>
        </header>
      </anarchitects-forms-ui-form>
    `,
  }),
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
