import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { Submission } from '@anarchitects/forms-ts/models';
import { AnarchitectsFormsUiSubmissionList } from './submission-list';

const sampleSubmissions: Submission[] = [
  {
    id: 'submission-1',
    formId: 'contact',
    formVersion: 1,
    payload: { name: 'Jane Doe', email: 'jane@example.com' },
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  },
  {
    id: 'submission-2',
    formId: 'contact',
    formVersion: 2,
    payload: { name: 'John Smith', message: 'Hello' },
    createdAt: new Date('2026-01-02T11:30:00.000Z'),
    updatedAt: new Date('2026-01-02T11:30:00.000Z'),
  },
];

const meta: Meta<AnarchitectsFormsUiSubmissionList> = {
  component: AnarchitectsFormsUiSubmissionList,
  title: 'Forms UI/Submission List',
  decorators: [
    moduleMetadata({
      imports: [AnxTemplateDirective],
    }),
  ],
};

export default meta;

type Story = StoryObj<AnarchitectsFormsUiSubmissionList>;

export const Primary: Story = {
  args: {
    submissions: sampleSubmissions,
  },
};

export const GridLayout: Story = {
  args: {
    submissions: sampleSubmissions,
    layout: 'list:grid',
    layoutOptions: { columns: 2 },
  },
};

export const TemplateOverride: Story = {
  args: {
    submissions: sampleSubmissions,
    layout: 'list:card',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-forms-ui-submission-list
        [submissions]="submissions"
        [layout]="layout"
      >
        <ng-template anxTemplate="item" let-submission>
          <section class="anx-stack" style="gap: .25rem;">
            <strong>Custom: {{ submission.formId }}</strong>
            <span>Payload fields: {{ submission.payload ? 'available' : 'none' }}</span>
          </section>
        </ng-template>
      </anarchitects-forms-ui-submission-list>
    `,
  }),
};
