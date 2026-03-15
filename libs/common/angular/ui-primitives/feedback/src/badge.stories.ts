import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiBadge } from './badge';

const meta: Meta<AnarchitectsUiBadge> = {
  component: AnarchitectsUiBadge,
  title: 'UI Primitives/Badge',
  args: {
    tone: 'primary',
    appearance: 'solid',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-ui-badge [tone]="tone" [appearance]="appearance" [size]="size">
        Beta
      </anarchitects-ui-badge>
    `,
  }),
};

export default meta;
type Story = StoryObj<AnarchitectsUiBadge>;

export const Primary: Story = {};

export const SuccessOutline: Story = {
  args: {
    tone: 'success',
    appearance: 'outline',
  },
};
