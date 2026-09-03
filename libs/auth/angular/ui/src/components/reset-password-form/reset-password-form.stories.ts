import { AnarchitectsFormsTemplateDirective } from '@anarchitects/forms-angular/ui';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { AnarchitectsAuthUiResetPasswordForm } from './reset-password-form';

const meta: Meta<AnarchitectsAuthUiResetPasswordForm> = {
  component: AnarchitectsAuthUiResetPasswordForm,
  title: 'Auth UI/Reset Password Form',
  decorators: [
    moduleMetadata({
      imports: [AnarchitectsFormsTemplateDirective],
    }),
  ],
};

export default meta;
type Story = StoryObj<AnarchitectsAuthUiResetPasswordForm>;

export const Primary: Story = {};

export const WithProvidedToken: Story = {
  args: {
    token: 'prefilled-reset-token',
    layout: 'form:inline',
  },
};

export const TemplateOverride: Story = {
  args: {
    layout: 'form:stacked',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-auth-ui-reset-password-form [layout]="layout">
        <ng-template anxTemplate="actions">
          <p class="anx-text">Use a strong password with 12+ chars.</p>
        </ng-template>
      </anarchitects-auth-ui-reset-password-form>
    `,
  }),
};
