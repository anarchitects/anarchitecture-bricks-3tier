import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AnarchitectsUiAlert } from '@anarchitects/common-angular-ui-primitives/feedback';
import { AnarchitectsUiCard } from '@anarchitects/common-angular-ui-primitives/surfaces';
import { AnxResolvedLayoutContext } from '@anarchitects/common-angular-ui-layouts/contracts';
import { toAnxListLayoutModel } from './layout-models';
import { resolveLayoutVariant, resolveTemplate } from './layout-renderer.utils';

@Component({
  selector: 'anarchitects-ui-default-list-layout-renderer',
  imports: [NgTemplateOutlet, AnarchitectsUiAlert, AnarchitectsUiCard],
  templateUrl: './list-layout-renderer.component.html',
  styleUrl: './list-layout-renderer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-default-layout anx-default-layout--list',
    '[attr.data-layout-variant]': 'layoutVariant()',
    'attr.data-anx-component': '"layout-list"',
  },
})
export class AnarchitectsUiDefaultListLayoutRenderer {
  readonly context = input.required<AnxResolvedLayoutContext>();

  readonly layoutVariant = computed(() => {
    return resolveLayoutVariant(this.context().layout.id);
  });

  readonly model = computed(() => {
    return toAnxListLayoutModel(this.context().model);
  });

  readonly items = computed(() => {
    return this.model().items;
  });

  readonly requiredItemTemplate = computed(() => {
    const itemTemplate = resolveTemplate(this.context(), 'item');
    if (!itemTemplate) {
      throw new Error(
        `Layout '${this.context().layout.id}' requires template 'item'.`,
      );
    }

    return itemTemplate;
  });

  readonly cellTemplate = computed(() =>
    resolveTemplate(this.context(), 'cell'),
  );
  readonly rowDetailTemplate = computed(() =>
    resolveTemplate(this.context(), 'app-row-detail'),
  );

  readonly headerTemplate = computed(() =>
    resolveTemplate(this.context(), 'header'),
  );
  readonly toolbarTemplate = computed(() =>
    resolveTemplate(this.context(), 'toolbar'),
  );
  readonly actionsTemplate = computed(() =>
    resolveTemplate(this.context(), 'actions'),
  );
  readonly footerTemplate = computed(() =>
    resolveTemplate(this.context(), 'footer'),
  );
  readonly emptyTemplate = computed(() =>
    resolveTemplate(this.context(), 'empty'),
  );

  readonly columnCount = computed(() => {
    const optionColumns = Number(this.context().options['columns']);
    const modelColumns = Number(this.model().columns);

    const resolvedColumns = Number.isFinite(optionColumns)
      ? optionColumns
      : Number.isFinite(modelColumns)
        ? modelColumns
        : 3;

    return Math.max(1, Math.floor(resolvedColumns));
  });

  readonly expandableRows = computed(() => {
    return Boolean(this.context().options['expandableRows']);
  });
}
