import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsAuthUiPasskeys } from './passkeys';

const meta: Meta<AnarchitectsAuthUiPasskeys> = {
  component: AnarchitectsAuthUiPasskeys,
  title: 'Auth UI/Passkeys',
  args: { supported: true },
};
export default meta;
type Story = StoryObj<AnarchitectsAuthUiPasskeys>;
export const SignIn: Story = {};
export const Enrollment: Story = { args: { mode: 'enroll' } };
export const Pending: Story = { args: { loading: true } };
export const Cancelled: Story = { args: { cancelled: true } };
export const Completed: Story = { args: { success: true } };
export const Failed: Story = {
  args: { error: 'Passkey verification failed. Try again.' },
};
export const Unsupported: Story = { args: { supported: false } };
export const PasswordFallback: Story = {
  render: () => ({
    template:
      '<anarchitects-auth-ui-passkeys [supported]="false"><a passkeyFallback href="/login">Use password sign-in</a></anarchitects-auth-ui-passkeys>',
  }),
};
