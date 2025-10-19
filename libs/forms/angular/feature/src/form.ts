import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { FormConfig } from '@anarchitects/forms-ts/models';

@Component({
  selector: 'anarchitects-forms-feature-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureForm {
  private readonly store = inject(FormsStore);
  formConfig: FormConfig = {
    id: '',
    version: 0,
    fields: [],
  };
  formId = input.required<string>();
  formVersion = input<number>();

  constructor() {
    effect(() => {
      this.store.getFormDefinition({
        id: this.formId(),
        version: this.formVersion() || 1,
      });
    });
    effect(() => {
      const config = this.store.selectedFormConfig();
      if (config) {
        this.formConfig = config;
      }
    });
  }

  async submitForm(input: SubmissionRequestDTO) {
    this.store.submitForm(input);
  }
}
