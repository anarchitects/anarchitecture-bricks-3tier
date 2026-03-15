import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiCard } from './card';

const meta: Meta<AnarchitectsUiCard> = {
  component: AnarchitectsUiCard,
  title: 'UI Primitives/Card',
  args: {
    appearance: 'outlined',
    density: 'comfortable',
  },
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-ui-card [appearance]="appearance" [density]="density">
        <div anxSlot="header">Card Header</div>
        Card body content
        <div anxSlot="footer">Footer note</div>
      </anarchitects-ui-card>
    `,
  }),
};

export default meta;
type Story = StoryObj<AnarchitectsUiCard>;

export const Outlined: Story = {};

export const Elevated: Story = {
  args: {
    appearance: 'elevated',
  },
};

export const LegacyAliases: Story = {
  render: (args) => ({
    props: args,
    template: `
      <anarchitects-ui-card [appearance]="appearance" [density]="density">
        <div anxCardHeader>Card Header</div>
        Card body content
        <div anxCardFooter>Footer note</div>
      </anarchitects-ui-card>
    `,
  }),
};
