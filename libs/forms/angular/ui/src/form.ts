import {
  FormsLayoutId,
  FormsPagePresetInput,
  injectFormsPagePreset,
  normalizeFormsPagePreset,
} from '@anarchitects/forms-angular/config';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import {
  FormConfig,
  FormField as FormFieldConfig,
} from '@anarchitects/forms-ts/models';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  TemplateRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  SchemaFn,
  SchemaPath,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { resolveFormsPageLayout } from './page-preset';
import { AnarchitectsFormsTemplateDirective } from './projection';

export type FormsFieldValue = string | boolean;
export type FormsFormModel = Record<string, FormsFieldValue>;
export type FormsSchemaExtension = SchemaFn<FormsFormModel>;

function initialFieldValue(field: FormFieldConfig): FormsFieldValue {
  return field.kind === 'boolean' ? false : '';
}

export function createFormsModel(config: FormConfig): FormsFormModel {
  return Object.fromEntries(
    config.fields.map((field) => [field.name, initialFieldValue(field)]),
  );
}

function buildFormsSchema(
  config: FormConfig,
  extensions: readonly FormsSchemaExtension[],
): FormsSchemaExtension {
  return (path) => {
    for (const field of config.fields) {
      const fieldPath = path[field.name] as SchemaPath<FormsFieldValue>;
      const stringPath = fieldPath as SchemaPath<string>;

      if (field.required) {
        required(fieldPath, { message: 'This field is required.' });
      }
      if (field.minLength !== undefined) {
        minLength(stringPath, field.minLength, {
          message: `Minimum length is ${field.minLength}.`,
        });
      }
      if (field.maxLength !== undefined) {
        maxLength(stringPath, field.maxLength, {
          message: `Maximum length is ${field.maxLength}.`,
        });
      }
      if (field.kind === 'email') {
        email(stringPath, { message: 'Enter a valid email address.' });
      }
      if (field.pattern) {
        pattern(stringPath, new RegExp(field.pattern), {
          message: 'Enter a value in the required format.',
        });
      }
    }

    for (const rule of config.validationRules ?? []) {
      if (rule.kind !== 'matchFields') {
        continue;
      }

      const sourcePath = path[rule.sourceField] as SchemaPath<FormsFieldValue>;
      const targetPath = path[rule.targetField] as SchemaPath<FormsFieldValue>;
      validate(targetPath, ({ value, valueOf }) => {
        const targetValue = value();
        if (targetValue === '') {
          return undefined;
        }

        return valueOf(sourcePath) === targetValue
          ? undefined
          : {
              kind: rule.kind,
              message: rule.message ?? 'Fields must match.',
            };
      });
    }

    for (const extension of extensions) {
      extension(path);
    }
  };
}

@Component({
  selector: 'anarchitects-forms-ui-form',
  imports: [FormField, NgTemplateOutlet],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-form',
    'attr.data-anx-component': '"forms-ui-form"',
    '[attr.data-anx-layout]': 'resolvedLayout().variant',
    '[attr.data-anx-spacing]': 'resolvedLayout().spacing',
    '[style.--anx-forms-ui-max-inline-size]': 'formMaxInlineSize() ?? null',
    '[style.--anx-forms-layout-columns]': 'resolvedLayout().columns',
    '[style.--anx-forms-actions-justify]': 'resolvedLayout().actionJustify',
  },
})
export class AnarchitectsUiForm {
  private readonly injector = inject(Injector);
  private readonly injectedPagePreset = injectFormsPagePreset();
  private readonly templates = contentChildren(
    AnarchitectsFormsTemplateDirective,
  );

  readonly config = input.required<FormConfig>();
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layout = input<FormsLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly pagePreset = input<FormsPagePresetInput | null>(null);
  readonly pageTitle = input<string | null>(null);
  readonly pageSubtitle = input<string | null>(null);
  readonly pageCaption = input<string | null>(null);
  readonly submitted = output<SubmissionRequestDTO>();

  readonly formModel = signal<FormsFormModel>({});
  readonly signalForm = signal<FieldTree<FormsFormModel> | null>(null);

  readonly resolvedPagePreset = computed(() =>
    normalizeFormsPagePreset(this.pagePreset() ?? this.injectedPagePreset),
  );
  readonly resolvedLayout = computed(() =>
    resolveFormsPageLayout(
      this.layout(),
      this.layoutOptions(),
      this.resolvedPagePreset(),
    ),
  );
  readonly formMaxInlineSize = computed(
    () => this.resolvedLayout().maxInlineSize,
  );
  readonly resolvedPageTitle = computed(() =>
    this.normalizeHeaderText(
      this.pageTitle() ?? this.resolvedPagePreset().pageTitle,
    ),
  );
  readonly resolvedPageSubtitle = computed(() =>
    this.normalizeHeaderText(
      this.pageSubtitle() ?? this.resolvedPagePreset().pageSubtitle,
    ),
  );
  readonly resolvedPageCaption = computed(() =>
    this.normalizeHeaderText(
      this.pageCaption() ?? this.resolvedPagePreset().pageCaption,
    ),
  );

  constructor() {
    effect(() => {
      const config = this.config();
      const extensions = this.schemaExtensions();

      untracked(() => {
        this.formModel.set(createFormsModel(config));
        this.signalForm.set(
          form(this.formModel, buildFormsSchema(config, extensions), {
            injector: this.injector,
          }),
        );
      });
    });
  }

  fieldTree(fieldName: string): FieldTree<FormsFieldValue> | undefined {
    return this.signalForm()?.[fieldName] as
      | FieldTree<FormsFieldValue>
      | undefined;
  }

  stringFieldTree(fieldName: string): FieldTree<string> | undefined {
    return this.fieldTree(fieldName) as FieldTree<string> | undefined;
  }

  booleanFieldTree(fieldName: string): FieldTree<boolean> | undefined {
    return this.fieldTree(fieldName) as FieldTree<boolean> | undefined;
  }

  template(name: string): TemplateRef<unknown> | null {
    return (
      this.templates().find((entry) => entry.anxTemplate() === name)
        ?.templateRef ?? null
    );
  }

  private normalizeHeaderText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  fieldHelpText(field: FormFieldConfig): string | null {
    return this.normalizeHeaderText(field.ui?.help);
  }

  fieldId(fieldName: string): string {
    return fieldName;
  }

  fieldErrorMessage(fieldName: string): string | null {
    const field = this.fieldTree(fieldName);
    if (!field) {
      return null;
    }

    const state = field();
    if (!(state.touched() || state.dirty()) || !state.invalid()) {
      return null;
    }

    return state.errors()[0]?.message ?? 'Invalid value.';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.fieldTree(fieldName);
    if (!field) {
      return false;
    }

    const state = field();
    return state.invalid() && (state.touched() || state.dirty());
  }

  async onSubmit(): Promise<boolean> {
    const currentForm = this.signalForm();
    if (!currentForm) {
      return false;
    }

    return submit(currentForm, async () => {
      const submission: SubmissionRequestDTO = {
        formId: this.config().id,
        formVersion: this.config().version,
        payload: { ...this.formModel() },
      };
      this.submitted.emit(submission);
      currentForm().reset(createFormsModel(this.config()));
      return undefined;
    });
  }
}
