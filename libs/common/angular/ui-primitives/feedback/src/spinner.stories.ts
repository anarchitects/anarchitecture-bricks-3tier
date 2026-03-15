import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiSpinner } from './spinner';

const meta: Meta<AnarchitectsUiSpinner> = {
  component: AnarchitectsUiSpinner,
  title: 'UI Primitives/Spinner',
  args: {
    tone: 'primary',
    size: 'md',
    label: 'Loading',
  },
};

export default meta;
type Story = StoryObj<AnarchitectsUiSpinner>;

export const Primary: Story = {};

export const DangerLarge: Story = {
  args: {
    tone: 'danger',
    size: 'lg',
  },
};
