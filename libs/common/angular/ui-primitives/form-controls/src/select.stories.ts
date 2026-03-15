import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiSelectDirective } from './select.directive';

const meta: Meta = {
  title: 'UI Primitives/Select',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  render: () => ({
    imports: [AnarchitectsUiSelectDirective],
    template: `
      <select anarchitectsUiSelect>
        <option>One</option>
        <option>Two</option>
      </select>
    `,
  }),
};
