import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormField, disabled, validate } from '@angular/forms/signals';
import {
  AnarchitectsUiForm,
  AnarchitectsFormsTemplateDirective,
  type FormsSchemaExtension,
} from '@anarchitects/forms-angular/ui';
import type { FormConfig } from '@anarchitects/forms-ts/models';
import type { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';
import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';
import type { NewsletterSignupPresentation } from '@anarchitects/newsletter-angular/config';

@Component({
  selector: 'anarchitects-newsletter-signup',
  imports: [AnarchitectsUiForm, AnarchitectsFormsTemplateDirective, FormField],
  templateUrl: './newsletter-signup.html',
  styleUrl: './newsletter-signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterSignup {
  /** Unique in the host document and stable between server and client. */
  readonly idPrefix = input.required<string>();
  readonly policy = input.required<NewsletterConsentPolicy>();
  readonly presentation = input.required<NewsletterSignupPresentation>();
  readonly busy = input(false);
  readonly accepted = input(false);
  readonly failureMessage = input('');
  readonly signupRequested = output<NewsletterSubscriptionRequestDTO>();
  readonly renderer = viewChild(AnarchitectsUiForm);

  readonly formConfig = computed<FormConfig>(() => {
    // A changed policy rebuilds the Forms field tree, clearing any earlier consent.
    const policy = this.policy();
    return {
      id: `newsletter:${policy.version}:${policy.text}`,
      version: 1,
      fields: [
        { name: 'email', kind: 'email', required: true, maxLength: 254 },
        { name: 'website', kind: 'string', maxLength: 2048 },
        { name: 'consent', kind: 'boolean' },
      ],
    };
  });
  readonly schemaExtensions: readonly FormsSchemaExtension[] = [
    (path) => {
      validate(path['consent'], ({ value }) =>
        value() === true ? undefined : { kind: 'consentRequired' },
      );
      disabled(path, () => this.busy());
    },
  ];
  readonly errorMessage = computed(() => {
    const renderer = this.renderer();
    if (renderer?.isFieldInvalid('email'))
      return this.presentation().invalidEmailMessage;
    if (renderer?.isFieldInvalid('consent'))
      return this.presentation().consentRequiredMessage;
    return this.failureMessage();
  });

  requestSignup(event: Event): void {
    event.preventDefault();
    if (!this.busy() && !this.accepted()) void this.renderer()?.onSubmit();
  }

  emitSignup(submission: SubmissionRequestDTO): void {
    if (
      this.busy() ||
      this.accepted() ||
      submission.formId !== this.formConfig().id
    )
      return;
    const { email, consent, website } = submission.payload;
    if (
      typeof email !== 'string' ||
      consent !== true ||
      typeof website !== 'string'
    )
      return;
    this.signupRequested.emit({
      email,
      consent: true,
      consentVersion: this.policy().version,
      website,
    });
  }
}
