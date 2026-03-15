import type { Meta, StoryObj } from '@storybook/angular';
import { AnarchitectsUiField } from './field';
import { AnarchitectsUiInputDirective } from './input.directive';

const meta: Meta = {
  title: 'UI Primitives/Field',
  decorators: [],
};

export default meta;
type Story = StoryObj;

export const WithInput: Story = {
  render: () => ({
    imports: [AnarchitectsUiField, AnarchitectsUiInputDirective],
    template: `
      <anarchitects-ui-field [forId]="'email'" [required]="true">
        <span anxLabel>Email</span>
        <input id="email" anarchitectsUiInput placeholder="user@example.com" />
        <span anxHint>We only use this for account updates.</span>
      </anarchitects-ui-field>
    `,
  }),
};

export const Invalid: Story = {
  render: () => ({
    imports: [AnarchitectsUiField, AnarchitectsUiInputDirective],
    template: `
      <anarchitects-ui-field [forId]="'email2'" [invalid]="true">
        <span anxLabel>Email</span>
        <input id="email2" anarchitectsUiInput [invalid]="true" />
        <span anxError>Invalid email</span>
      </anarchitects-ui-field>
    `,
  }),
};
