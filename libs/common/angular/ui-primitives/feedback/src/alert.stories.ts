import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiAlert } from './alert';

const meta: Meta<AnarchitectsUiAlert> = {
  component: AnarchitectsUiAlert,
  title: 'UI Primitives/Alert',
  args: {
    tone: 'neutral',
    appearance: 'solid',
    dismissible: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-ui-alert [tone]="tone" [appearance]="appearance" [dismissible]="dismissible">
        Alert message for the user.
      </anarchitects-ui-alert>
    `,
  }),
};

export default meta;
type Story = StoryObj<AnarchitectsUiAlert>;

export const Neutral: Story = {};

export const DangerDismissible: Story = {
  args: {
    tone: 'danger',
    dismissible: true,
  },
};
