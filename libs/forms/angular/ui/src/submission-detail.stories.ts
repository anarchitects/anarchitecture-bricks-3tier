import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { Submission } from '@anarchitects/forms-ts/models';
import { AnarchitectsFormsUiSubmissionDetail } from './submission-detail';
import { AnarchitectsFormsTemplateDirective } from './projection';

const sampleSubmission: Submission = {
  id: 'submission-1',
  formId: 'contact',
  formVersion: 1,
  payload: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'Hello team',
  },
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-01T10:00:00.000Z'),
};

const meta: Meta<AnarchitectsFormsUiSubmissionDetail> = {
  component: AnarchitectsFormsUiSubmissionDetail,
  title: 'Forms UI/Submission Detail',
  decorators: [
    moduleMetadata({
      imports: [AnarchitectsFormsTemplateDirective],
    }),
  ],
};

export default meta;

type Story = StoryObj<AnarchitectsFormsUiSubmissionDetail>;

export const Primary: Story = {
  args: {
    submission: sampleSubmission,
  },
};

export const SidebarLayout: Story = {
  args: {
    submission: sampleSubmission,
    layout: 'detail:sidebar',
  },
};

export const TemplateOverride: Story = {
  args: {
    submission: sampleSubmission,
    layout: 'detail:card',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-ui-submission-detail
        [submission]="submission"
        [layout]="layout"
      >
        <ng-template anxTemplate="content" let-model>
          <section class="anx-stack" style="gap: .25rem;">
            <strong>Custom content template</strong>
            <span>Form: {{ model.data?.formId }}</span>
            <span>Version: {{ model.data?.formVersion }}</span>
          </section>
        </ng-template>
      </anarchitects-forms-ui-submission-detail>
    `,
  }),
};
