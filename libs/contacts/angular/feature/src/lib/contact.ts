import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ContactsApi } from '@anarchitects/contacts-angular-data-access';
import type { Contact } from '@anarchitects/contacts-ts-models';
import { ContactRequestDto } from '@anarchitects/contacts-ts-dtos';

type ContactForm = {
  [field in keyof Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>]: FormControl<Contact[field] | null>;
};

@Component({
  selector: 'anarchitects-contacts-feature',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsContactsFeature {
  private readonly contactsApi = inject(ContactsApi);
  private readonly fb = inject(FormBuilder);
  readonly contactForm = this.fb.group<ContactForm>({
    name: this.fb.control<string | null>(null, [Validators.required]),
    email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
    message: this.fb.control<string | null>(null, [Validators.required]),
  });

  onSubmit() {
    if (this.contactForm.valid) {
      const contactData: ContactRequestDto = Object.assign(this.contactForm.value);
      this.contactsApi.createContact(contactData);
    }
  }
}
