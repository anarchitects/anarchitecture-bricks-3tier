import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ContactStore } from '@anarchitects/contacts-angular/state';
import {
  ContactForm,
  AnarchitectsUiContactForm,
} from '@anarchitects/contacts-angular/ui';

@Component({
  selector: 'anarchitects-feature-contact-form',
  imports: [AnarchitectsUiContactForm],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureContactForm {
  private readonly contactStore = inject(ContactStore);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group<ContactForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // TODO: Create common loading/success/error component
  readonly success = this.contactStore.success;
  readonly loading = this.contactStore.loading;
  readonly error = this.contactStore.error;

  onSubmit() {
    if (this.form.valid) {
      this.contactStore.submitForm(this.form.getRawValue());
      this.form.reset();
    }
  }
}
