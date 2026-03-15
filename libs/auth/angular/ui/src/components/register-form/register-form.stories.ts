import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AnarchitectsAuthUiRegisterForm } from './register-form';

const meta: Meta<AnarchitectsAuthUiRegisterForm> = {
  component: AnarchitectsAuthUiRegisterForm,
  title: 'Auth UI/Register Form',
  decorators: [
    moduleMetadata({
      imports: [AnxTemplateDirective],
    }),
  ],
};

export default meta;
type Story = StoryObj<AnarchitectsAuthUiRegisterForm>;

export const Primary: Story = {};

export const GridLayout: Story = {
  args: {
    layout: 'form:grid',
    layoutOptions: { columns: 2 },
  },
};

export const TemplateOverride: Story = {
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-auth-ui-register-form [layout]="layout" [layoutOptions]="layoutOptions">
        <ng-template anxTemplate="field" let-field>
          <section class="anx-stack" style="gap: .25rem;">
            <strong>{{ field.ui?.label ?? field.name }}</strong>
            <span class="anx-text">Custom registration field template.</span>
          </section>
        </ng-template>
      </anarchitects-auth-ui-register-form>
    `,
  }),
};
