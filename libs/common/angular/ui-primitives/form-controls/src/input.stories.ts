import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiInputDirective } from './input.directive';

const meta: Meta = {
  title: 'UI Primitives/Input',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  render: () => ({
    imports: [AnarchitectsUiInputDirective],
    template: `<input anarchitectsUiInput placeholder="Type here" />`,
  }),
};

export const LargeInvalid: Story = {
  render: () => ({
    imports: [AnarchitectsUiInputDirective],
    template: `<input anarchitectsUiInput [size]="'lg'" [invalid]="true" value="bad" />`,
  }),
};
