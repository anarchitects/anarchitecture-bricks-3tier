import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Contact } from '@anarchitects/contacts-ts/models';

export type ContactForm = {
  [field in keyof Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>]: FormControl<
    Contact[field]
  >;
};

@Component({
  selector: 'anarchitects-contacts-ui-form',
  imports: [ReactiveFormsModule],
  templateUrl: './form.html',
  styleUrl: './form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsUiContactForm {
  readonly contactForm = input.required<FormGroup<ContactForm>>();
  readonly submitted = output<void>();
}
