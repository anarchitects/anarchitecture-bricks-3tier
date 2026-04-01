import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { provideAnxDefaultLayouts } from '@anarchitects/common-angular-ui-layouts/defaults';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';
import { AnarchitectsUiButton } from '@anarchitects/common-angular-ui-primitives/actions';
import {
  AnarchitectsUiField,
  AnarchitectsUiInputDirective,
  AnarchitectsUiSelectDirective,
  AnarchitectsUiTextareaDirective,
} from '@anarchitects/common-angular-ui-primitives/form-controls';
import {
  FormsPagePresetInput,
  injectFormsPagePreset,
  normalizeFormsPagePreset,
} from '@anarchitects/forms-angular/config';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import {
  FormConfig,
  FormField,
  FormValidationRule,
} from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { resolveFormsPageLayout } from './page-preset';

type CrossFieldError = {
  kind: string;
  message: string;
};

type CrossFieldErrors = Record<string, CrossFieldError>;

function buildFieldValidators(field: FormField): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (field.required) {
    validators.push(Validators.required);
  }
  if (field.minLength) {
    validators.push(Validators.minLength(field.minLength));
  }
  if (field.maxLength) {
    validators.push(Validators.maxLength(field.maxLength));
  }
  if (field.kind === 'email') {
    validators.push(Validators.email);
  }

  return validators;
}

function buildConfigValidator(
  rules: readonly FormValidationRule[] | undefined,
): ValidatorFn | null {
  if (!rules?.length) {
    return null;
  }

  return (control: AbstractControl): ValidationErrors | null => {
    const crossField: CrossFieldErrors = {};

    for (const rule of rules) {
      if (rule.kind !== 'matchFields') {
        continue;
      }

      const sourceControl = control.get(rule.sourceField);
      const targetControl = control.get(rule.targetField);
      if (!sourceControl || !targetControl) {
        continue;
      }

      if (sourceControl.value === targetControl.value) {
        continue;
      }

      crossField[rule.targetField] = {
        kind: rule.kind,
        message: rule.message ?? 'Fields must match.',
      };
    }

    return Object.keys(crossField).length > 0 ? { crossField } : null;
  };
}

@Component({
  selector: 'anarchitects-forms-ui-form',
  imports: [
    ReactiveFormsModule,
    AnarchitectsUiLayoutHost,
    AnarchitectsUiField,
    AnarchitectsUiButton,
    AnarchitectsUiInputDirective,
    AnarchitectsUiTextareaDirective,
    AnarchitectsUiSelectDirective,
    AnxSlotDirective,
    AnxTemplateDirective,
  ],
  providers: [provideAnxDefaultLayouts()],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-form anx-stack',
    'attr.data-anx-component': '"forms-ui-form"',
    '[style.--anx-forms-ui-max-inline-size]': 'formMaxInlineSize() ?? null',
  },
})
export class AnarchitectsUiForm {
  private readonly fb = inject(FormBuilder);
  private readonly injectedPagePreset = injectFormsPagePreset();

  readonly formGroup = this.fb.group({});
  readonly config = input.required<FormConfig>();
  readonly runtimeValidators = input<readonly ValidatorFn[]>([]);
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly pagePreset = input<FormsPagePresetInput | null>(null);
  readonly pageTitle = input<string | null>(null);
  readonly pageSubtitle = input<string | null>(null);
  readonly pageCaption = input<string | null>(null);
  readonly submitted = output<SubmissionRequestDTO>();

  readonly resolvedPagePreset = computed(() => {
    const inputPreset = this.pagePreset();
    if (inputPreset) {
      return normalizeFormsPagePreset(inputPreset);
    }

    return normalizeFormsPagePreset(this.injectedPagePreset);
  });

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

  readonly resolvedPageTitle = computed(() => {
    return this.normalizeHeaderText(
      this.pageTitle() ?? this.resolvedPagePreset().pageTitle,
    );
  });

  readonly resolvedPageSubtitle = computed(() => {
    return this.normalizeHeaderText(
      this.pageSubtitle() ?? this.resolvedPagePreset().pageSubtitle,
    );
  });

  readonly resolvedPageCaption = computed(() => {
    return this.normalizeHeaderText(
      this.pageCaption() ?? this.resolvedPagePreset().pageCaption,
    );
  });

  readonly layoutModel = computed(() => ({
    title: this.config().id,
    fields: this.config().fields,
  }));

  constructor() {
    effect(() => {
      const config = this.config();

      for (const fieldName of Object.keys(this.formGroup.controls)) {
        this.formGroup.removeControl(fieldName);
      }

      for (const field of config.fields) {
        this.formGroup.addControl(
          field.name,
          this.fb.control(null, buildFieldValidators(field)),
        );
      }

      this.formGroup.reset();
      this.formGroup.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const configValidator = buildConfigValidator(
        this.config().validationRules,
      );
      const validators = [
        ...(configValidator ? [configValidator] : []),
        ...this.runtimeValidators(),
      ];

      this.formGroup.setValidators(validators.length > 0 ? validators : null);
      this.formGroup.updateValueAndValidity({ emitEvent: false });
    });
  }

  private crossFieldError(fieldName: string): CrossFieldError | null {
    const errors = this.formGroup.errors?.['crossField'] as
      | CrossFieldErrors
      | undefined;

    return errors?.[fieldName] ?? null;
  }

  private shouldShowCrossFieldError(fieldName: string): boolean {
    const control = this.formGroup.get(fieldName);

    return Boolean(
      control &&
        this.crossFieldError(fieldName) &&
        (control.touched || control.dirty),
    );
  }

  private normalizeHeaderText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  fieldId(fieldName: string): string {
    return fieldName;
  }

  fieldErrorMessage(fieldName: string): string | null {
    const control = this.formGroup.get(fieldName);
    if (!control) {
      return null;
    }

    if (control.touched && control.invalid) {
      if (control.hasError('required')) {
        return 'This field is required.';
      }

      if (control.hasError('email')) {
        return 'Enter a valid email address.';
      }

      if (control.hasError('minlength')) {
        const requiredLength = control.getError('minlength')?.requiredLength;
        return `Minimum length is ${requiredLength}.`;
      }

      if (control.hasError('maxlength')) {
        const requiredLength = control.getError('maxlength')?.requiredLength;
        return `Maximum length is ${requiredLength}.`;
      }

      return 'Invalid value.';
    }

    return this.shouldShowCrossFieldError(fieldName)
      ? (this.crossFieldError(fieldName)?.message ?? null)
      : null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.formGroup.get(fieldName);

    return Boolean(
      (control && control.touched && control.invalid) ||
        this.shouldShowCrossFieldError(fieldName),
    );
  }

  onSubmit() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const submission: SubmissionRequestDTO = {
      formId: this.config().id,
      formVersion: this.config().version,
      payload: this.formGroup.value,
    };
    this.submitted.emit(submission);
    this.formGroup.reset();
  }
}
