import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { FormConfig } from '@anarchitects/forms-ts';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { HttpResponse, http } from 'msw';
import { expect, userEvent, waitFor } from 'storybook/test';
import { AnarchitectsFeatureForm } from './form';

const meta: Meta<AnarchitectsFeatureForm> = {
  component: AnarchitectsFeatureForm,
  title: 'AnarchitectsFeatureForm',
  decorators: [
    moduleMetadata({
      imports: [AnxSlotDirective],
    }),
  ],
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

const getFormDefinitionHandler = http.get(
  '/api/forms/:requestedFormId',
  ({ params, request }) => {
    const requestedFormId = params['requestedFormId'];
    const requestedVersion = new URL(request.url).searchParams.get(
      'formVersion',
    );

    if (
      requestedFormId !== formId ||
      requestedVersion !== String(formVersion)
    ) {
      return HttpResponse.json({ message: 'Form not found' }, { status: 404 });
    }

    return HttpResponse.json({
      config: mockFormConfig,
      schema: {},
    });
  },
);

const submitFormHandler = http.post('/api/forms/submit', () =>
  HttpResponse.json(
    {
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
    { status: 201 },
  ),
);

export const Primary: Story = {
  args: {
    formId,
    formVersion,
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
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

export const CardLayout: Story = {
  args: {
    formId,
    formVersion,
    layout: 'form:card',
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
};

export const ContactPreset: Story = {
  args: {
    formId,
    formVersion,
    pagePreset: {
      layoutVariant: 'stacked',
      maxInlineSize: '42rem',
      spacing: 'comfortable',
      actionAlignment: 'end',
    },
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
};

export const PresetGridCompact: Story = {
  args: {
    formId,
    formVersion,
    pagePreset: {
      layoutVariant: 'grid',
      columns: 2,
      maxInlineSize: '56rem',
      spacing: 'compact',
      actionAlignment: 'center',
    },
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
};

export const ContactHeaderInputs: Story = {
  args: {
    formId,
    formVersion,
    pageTitle: 'Contact us!',
    pageCaption: 'Get in touch with us and we will get back to you ASAP.',
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
};

export const CaptionOnly: Story = {
  args: {
    formId,
    formVersion,
    pageCaption:
      'Our team reviews every request carefully before routing it to the best specialist.',
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
};

export const MultipleCaptionsTopAndBottom: Story = {
  args: {
    formId,
    formVersion,
    pageTitle: 'Support request',
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-feature-form [formId]="formId" [formVersion]="formVersion" [pageTitle]="pageTitle">
        <p anxSlot="app-forms-caption-top">Top caption A: Product support and onboarding</p>
        <p anxSlot="app-forms-caption-top">Top caption B: Billing and enterprise assistance</p>

        <p anxSlot="app-forms-caption-bottom">Bottom caption A: Typical response in 1 business day</p>
        <p anxSlot="app-forms-caption-bottom">Bottom caption B: Priority requests are triaged continuously</p>
      </anarchitects-forms-feature-form>
    `,
  }),
};

export const CustomHeaderSlotOverride: Story = {
  args: {
    formId,
    formVersion,
    pageTitle: 'Fallback title',
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-feature-form [formId]="formId" [formVersion]="formVersion" [pageTitle]="pageTitle">
        <header anxSlot="app-forms-page-header" class="anx-stack" style="gap: .25rem;">
          <h1>Custom projected feature header</h1>
          <p>This replaces pageTitle/pageSubtitle/pageCaption rendering.</p>
        </header>
      </anarchitects-forms-feature-form>
    `,
  }),
};

export const InvalidEmailKeepsFormInvalid: Story = {
  args: {
    formId,
    formVersion,
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler],
    },
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
    formId,
    formVersion,
  },
  parameters: {
    msw: {
      handlers: [getFormDefinitionHandler, submitFormHandler],
    },
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
