import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  signal,
} from '@angular/core';
import { AnarchitectsUiButton } from '@anarchitects/common-angular-ui-primitives/actions';
import {
  AnxResolvedLayoutContext,
  createAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';
import {
  provideAnxLayoutDefaults,
  provideAnxLayouts,
} from '@anarchitects/common-angular-ui-layouts/registry';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { provideAnxDefaultLayouts } from './default-layout.providers';

@Component({
  selector: 'anarchitects-layout-switcher-demo',
  imports: [
    AnarchitectsUiButton,
    AnarchitectsUiLayoutHost,
    AnxTemplateDirective,
  ],
  template: `
    <div class="anx-inline" style="margin-bottom: 1rem">
      <anarchitects-ui-button
        [appearance]="'outline'"
        (pressed)="setLayout('list:list')"
      >
        List
      </anarchitects-ui-button>
      <anarchitects-ui-button
        [appearance]="'outline'"
        (pressed)="setLayout('list:grid')"
      >
        Grid
      </anarchitects-ui-button>
      <anarchitects-ui-button
        [appearance]="'outline'"
        (pressed)="setLayout('list:card')"
      >
        Card
      </anarchitects-ui-button>
    </div>

    <anarchitects-ui-layout-host
      [kind]="'list'"
      [layout]="layout()"
      [model]="model()"
    >
      <ng-template anxTemplate="item" let-item>
        <div>{{ item.name }}</div>
      </ng-template>
    </anarchitects-ui-layout-host>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AnarchitectsLayoutSwitcherDemo {
  readonly layout = signal<'list:list' | 'list:grid' | 'list:card'>(
    'list:list',
  );
  readonly model = signal({
    items: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
  });

  setLayout(layout: 'list:list' | 'list:grid' | 'list:card'): void {
    this.layout.set(layout);
  }
}

@Component({
  selector: 'anarchitects-marketing-grid-layout',
  template: `
    <section class="anx-grid" [style.--anx-layout-columns]="3">
      @for (item of items(); track $index) {
        <article class="anx-surface anx-region">
          {{ item.name }}
        </article>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AnarchitectsMarketingGridLayout {
  readonly context = input.required<AnxResolvedLayoutContext>();

  readonly items = computed(() => {
    const model = this.context().model as { items?: { name: string }[] };
    return model.items ?? [];
  });
}

const meta: Meta = {
  title: 'UI Layouts/Host',
  decorators: [
    applicationConfig({
      providers: [...provideAnxDefaultLayouts()],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const FormGrid: Story = {
  render: () => ({
    template: `
      <anarchitects-ui-layout-host [kind]="'form'" [layout]="'form:grid'" [model]="model">
        <ng-template anxTemplate="field" let-field>
          <input [id]="field.key" [placeholder]="field.label" />
        </ng-template>
      </anarchitects-ui-layout-host>
    `,
    props: {
      model: {
        fields: [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
        ],
      },
    },
  }),
};

export const ListTable: Story = {
  render: () => ({
    template: `
      <anarchitects-ui-layout-host [kind]="'list'" [layout]="'list:table'" [model]="model">
        <ng-template anxTemplate="item" let-item>{{ item.name }}</ng-template>
        <ng-template anxTemplate="cell" let-item>
          <strong>{{ item.name }}</strong>
        </ng-template>
      </anarchitects-ui-layout-host>
    `,
    props: {
      model: {
        items: [{ name: 'Alpha' }, { name: 'Beta' }, { name: 'Gamma' }],
      },
    },
  }),
};

export const RuntimeSwitching: Story = {
  render: () => ({
    template: `<anarchitects-layout-switcher-demo />`,
    moduleMetadata: {
      imports: [AnarchitectsLayoutSwitcherDemo],
    },
  }),
};

export const ConsumerExtension: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...provideAnxDefaultLayouts(),
        ...provideAnxLayouts([
          {
            id: createAnxLayoutId('app-marketing', 'grid'),
            kind: 'app-marketing',
            renderer: AnarchitectsMarketingGridLayout,
            supportedTemplates: ['item'],
            supportedSlots: ['content'],
            description: 'Consumer marketing grid layout',
          },
        ]),
        provideAnxLayoutDefaults({
          'app-marketing': 'app-marketing:grid',
        }),
      ],
    }),
  ],
  render: () => ({
    template: `
      <anarchitects-ui-layout-host [kind]="'app-marketing'" [model]="model">
        <ng-template anxTemplate="item" let-item>{{ item.name }}</ng-template>
      </anarchitects-ui-layout-host>
    `,
    props: {
      model: {
        items: [
          { name: 'Enterprise Plan' },
          { name: 'Teams Plan' },
          { name: 'Starter Plan' },
        ],
      },
    },
  }),
};
