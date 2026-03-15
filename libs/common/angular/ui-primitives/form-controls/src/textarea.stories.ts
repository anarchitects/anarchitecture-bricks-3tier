import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiTextareaDirective } from './textarea.directive';

const meta: Meta = {
  title: 'UI Primitives/Textarea',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  render: () => ({
    imports: [AnarchitectsUiTextareaDirective],
    template: `<textarea anarchitectsUiTextarea rows="4">Message</textarea>`,
  }),
};
