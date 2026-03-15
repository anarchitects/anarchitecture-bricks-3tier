import {
  FormsStore,
  provideFormsState,
} from '@anarchitects/forms-angular/state';
import {
  AnarchitectsFormsUiSubmitted,
  AnarchitectsUiForm,
} from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'anarchitects-forms-feature-form',
  imports: [AnarchitectsUiForm, AnarchitectsFormsUiSubmitted],
  providers: [provideFormsState()],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureForm {
  private readonly store = inject(FormsStore);
  readonly submitted = this.store.submitted;
  formConfig = signal<FormConfig>({ id: '', version: 1, fields: [] });
  formId = input.required<string>();
  formVersion = input<number>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

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
        this.formConfig.set(config);
      }
    });
  }

  async submitForm(input: SubmissionRequestDTO) {
    this.store.submitForm(input);
  }
}
