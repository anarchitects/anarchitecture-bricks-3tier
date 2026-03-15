import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiButton } from './button';

const meta: Meta<AnarchitectsUiButton> = {
  component: AnarchitectsUiButton,
  title: 'UI Primitives/Button',
  args: {
    tone: 'primary',
    appearance: 'solid',
    size: 'md',
    density: 'comfortable',
    loading: false,
    disabled: false,
    type: 'button',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-ui-button
        [tone]="tone"
        [appearance]="appearance"
        [size]="size"
        [density]="density"
        [loading]="loading"
        [disabled]="disabled"
        [type]="type"
      >
        <span anxStart>+</span>
        Save
        <span anxEnd>-></span>
      </anarchitects-ui-button>
    `,
  }),
};

export default meta;
type Story = StoryObj<AnarchitectsUiButton>;

export const Primary: Story = {};

export const DangerOutline: Story = {
  args: {
    tone: 'danger',
    appearance: 'outline',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
