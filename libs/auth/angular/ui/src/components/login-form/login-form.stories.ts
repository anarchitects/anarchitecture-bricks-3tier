import { AnarchitectsFormsTemplateDirective } from '@anarchitects/forms-angular/ui';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AnarchitectsAuthUiLoginForm } from './login-form';

const meta: Meta<AnarchitectsAuthUiLoginForm> = {
  component: AnarchitectsAuthUiLoginForm,
  title: 'Auth UI/Login Form',
  decorators: [
    moduleMetadata({
      imports: [AnarchitectsFormsTemplateDirective],
    }),
  ],
};

export default meta;
type Story = StoryObj<AnarchitectsAuthUiLoginForm>;

export const Primary: Story = {};

export const CardLayout: Story = {
  args: {
    layout: 'form:card',
  },
};

export const TemplateOverride: Story = {
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-auth-ui-login-form [layout]="layout">
        <ng-template anxTemplate="actions">
          <p class="anx-text">Custom auth action area</p>
        </ng-template>
      </anarchitects-auth-ui-login-form>
    `,
  }),
};
