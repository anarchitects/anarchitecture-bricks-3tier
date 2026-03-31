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
        <span anxSlot="start">+</span>
        Save
        <span anxSlot="end">-></span>
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

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledOutline: Story = {
  args: {
    disabled: true,
    appearance: 'outline',
  },
};

export const DisabledGhost: Story = {
  args: {
    disabled: true,
    appearance: 'ghost',
  },
};

export const DisabledVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:1rem;">
        @for (tone of ['primary','neutral','success','danger']; track tone) {
          <div style="display:flex;gap:0.75rem;align-items:center;">
            @for (appearance of ['solid','outline','ghost']; track appearance) {
              <anarchitects-ui-button
                [tone]="tone"
                [appearance]="appearance"
                [disabled]="true"
              >
                {{ tone }} / {{ appearance }}
              </anarchitects-ui-button>
            }
          </div>
        }
      </div>
    `,
  }),
};

export const LegacyAliases: Story = {
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
