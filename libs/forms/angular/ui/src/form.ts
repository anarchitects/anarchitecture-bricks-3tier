import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnarchitectsUiButton } from '@anarchitects/common-angular-ui-primitives/actions';
import {
  AnarchitectsUiField,
  AnarchitectsUiInputDirective,
  AnarchitectsUiSelectDirective,
  AnarchitectsUiTextareaDirective,
} from '@anarchitects/common-angular-ui-primitives/form-controls';
import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { provideAnxDefaultLayouts } from '@anarchitects/common-angular-ui-layouts/defaults';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';

@Component({
  selector: 'anarchitects-forms-ui-form',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
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
  },
})
export class AnarchitectsUiForm {
  private readonly fb = inject(FormBuilder);
  readonly formGroup = this.fb.group({});
  readonly config = input.required<FormConfig>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<SubmissionRequestDTO>();

  readonly layoutModel = computed(() => ({
    title: this.config().id,
    fields: this.config().fields,
  }));

  constructor() {
    effect(() => {
      const config = this.config();
      if (config) {
        this.formGroup.reset();
        this.formGroup.clearValidators();
        this.formGroup.clearAsyncValidators();
        this.formGroup.updateValueAndValidity();
        for (const f of config.fields) {
          const v = [];
          if (f.required) {
            v.push(Validators.required);
          }
          if (f.minLength) {
            v.push(Validators.minLength(f.minLength));
          }
          if (f.maxLength) {
            v.push(Validators.maxLength(f.maxLength));
          }
          if (f.kind === 'email') {
            v.push(Validators.email);
          }
          this.formGroup.addControl(f.name, this.fb.control(null, v));
        }
      }
    });
  }

  fieldId(fieldName: string): string {
    return fieldName;
  }

  fieldErrorMessage(fieldName: string): string | null {
    const control = this.formGroup.get(fieldName);
    if (!control || !control.touched || !control.invalid) {
      return null;
    }

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

  isFieldInvalid(fieldName: string): boolean {
    const control = this.formGroup.get(fieldName);
    return Boolean(control && control.touched && control.invalid);
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
