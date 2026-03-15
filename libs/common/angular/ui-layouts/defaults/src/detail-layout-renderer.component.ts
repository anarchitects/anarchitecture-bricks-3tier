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
import { toAnxDetailLayoutModel } from './layout-models';
import { resolveLayoutVariant, resolveTemplate } from './layout-renderer.utils';

@Component({
  selector: 'anarchitects-ui-default-detail-layout-renderer',
  imports: [NgTemplateOutlet, AnarchitectsUiAlert, AnarchitectsUiCard],
  templateUrl: './detail-layout-renderer.component.html',
  styleUrl: './detail-layout-renderer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-default-layout anx-default-layout--detail anx-stack',
    '[attr.data-layout-variant]': 'layoutVariant()',
    'attr.data-anx-component': '"layout-detail"',
  },
})
export class AnarchitectsUiDefaultDetailLayoutRenderer {
  readonly context = input.required<AnxResolvedLayoutContext>();

  readonly layoutVariant = computed(() => {
    return resolveLayoutVariant(this.context().layout.id);
  });

  readonly model = computed(() => {
    return toAnxDetailLayoutModel(this.context().model);
  });

  readonly requiredContentTemplate = computed(() => {
    const contentTemplate = resolveTemplate(this.context(), 'content');
    if (!contentTemplate) {
      throw new Error(
        `Layout '${this.context().layout.id}' requires template 'content'.`,
      );
    }

    return contentTemplate;
  });

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
  readonly sidebarTemplate = computed(() =>
    resolveTemplate(this.context(), 'sidebar'),
  );
}
