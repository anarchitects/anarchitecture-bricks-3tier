import { AnxResolvedLayoutContext } from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnarchitectsUiButton } from '@anarchitects/common-angular-ui-primitives/actions';
import { AnarchitectsUiAlert } from '@anarchitects/common-angular-ui-primitives/feedback';
import { AnarchitectsUiField } from '@anarchitects/common-angular-ui-primitives/form-controls';
import { AnarchitectsUiCard } from '@anarchitects/common-angular-ui-primitives/surfaces';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AnxFormLayoutField, toAnxFormLayoutModel } from './layout-models';
import { resolveLayoutVariant, resolveTemplate } from './layout-renderer.utils';

@Component({
  selector: 'anarchitects-ui-default-form-layout-renderer',
  imports: [
    NgTemplateOutlet,
    AnarchitectsUiAlert,
    AnarchitectsUiButton,
    AnarchitectsUiCard,
    AnarchitectsUiField,
  ],
  templateUrl: './form-layout-renderer.component.html',
  styleUrl: './form-layout-renderer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-default-layout anx-default-layout--form',
    '[attr.data-layout-variant]': 'layoutVariant()',
    'attr.data-anx-component': '"layout-form"',
    '[style.--anx-layout-form-gap]': 'formGap()',
    '[style.--anx-layout-form-inline-gap]': 'formInlineGap()',
    '[style.--anx-layout-form-actions-justify]': 'actionsJustifyContent()',
  },
})
export class AnarchitectsUiDefaultFormLayoutRenderer {
  readonly context = input.required<AnxResolvedLayoutContext>();

  readonly layoutVariant = computed(() => {
    return resolveLayoutVariant(this.context().layout.id);
  });

  readonly model = computed(() => {
    return toAnxFormLayoutModel(this.context().model);
  });

  readonly fields = computed(() => {
    return this.model().fields;
  });

  readonly requiredFieldTemplate = computed(() => {
    const fieldTemplate = resolveTemplate(this.context(), 'field');
    if (!fieldTemplate) {
      throw new Error(
        `Layout '${this.context().layout.id}' requires template 'field'.`,
      );
    }

    return fieldTemplate;
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
        : 2;

    return Math.max(1, Math.floor(resolvedColumns));
  });

  readonly formGap = computed(() => {
    const spacingOption = String(
      this.context().options['spacing'] ?? '',
    ).trim();

    switch (spacingOption) {
      case 'compact':
        return 'var(--anx-sys-space-sm)';
      case 'relaxed':
        return 'var(--anx-sys-space-lg)';
      case 'comfortable':
      case '':
        return 'var(--anx-layout-gap-stack)';
      default:
        return spacingOption;
    }
  });

  readonly formInlineGap = computed(() => {
    const spacingOption = String(
      this.context().options['spacing'] ?? '',
    ).trim();

    switch (spacingOption) {
      case 'compact':
        return 'var(--anx-sys-space-xs)';
      case 'relaxed':
        return 'var(--anx-sys-space-md)';
      case 'comfortable':
      case '':
        return 'var(--anx-layout-gap-inline)';
      default:
        return spacingOption;
    }
  });

  readonly actionsJustifyContent = computed(() => {
    const actionAlignment = String(
      this.context().options['actionAlignment'] ?? '',
    ).trim();

    switch (actionAlignment) {
      case 'start':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'between':
        return 'space-between';
      case 'end':
      case '':
        return 'flex-end';
      default:
        return actionAlignment;
    }
  });

  fieldId(field: AnxFormLayoutField, index: number): string {
    const id = field.id ?? field.key ?? field.name;
    return String(id ?? `field-${index}`);
  }

  fieldLabel(field: AnxFormLayoutField, index: number): string {
    return String(
      field.label ?? field.name ?? field.key ?? `Field ${index + 1}`,
    );
  }

  fieldRequired(field: AnxFormLayoutField): boolean {
    return Boolean(field.required);
  }
}
