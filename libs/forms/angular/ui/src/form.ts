import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'anarchitects-forms-ui-form',
  imports: [ReactiveFormsModule],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsUiForm {
  private readonly fb = inject(FormBuilder);
  readonly formGroup = this.fb.group({});
  readonly config = input.required<FormConfig>();
  readonly submitted = output<SubmissionRequestDTO>();

  constructor() {
    effect(() => {
      for (const f of this.config().fields) {
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
    });
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
