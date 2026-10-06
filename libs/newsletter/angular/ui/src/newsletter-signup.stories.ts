import type { Meta, StoryObj } from '@storybook/angular';
import { NewsletterSignup } from './newsletter-signup';

const meta: Meta<NewsletterSignup> = {
  component: NewsletterSignup,
  title: 'Newsletter/Signup',
  tags: ['autodocs'],
  args: {
    idPrefix: 'story-newsletter',
    policy: {
      version: 'example/v1',
      text: 'I agree to receive the host newsletter.',
    },
    presentation: {
      heading: 'Newsletter',
      description: 'Host-configurable signup copy.',
      emailLabel: 'Email address',
      submitLabel: 'Sign up',
      submittingMessage: 'Sending request…',
      successMessage: 'Your request has been received.',
      invalidEmailMessage: 'Enter a valid email address.',
      consentRequiredMessage: 'Please agree to receive the newsletter.',
      invalidRequestMessage: 'Review your details and consent.',
      rateLimitedMessage: 'Please try again later.',
      unavailableMessage: 'Unable to send. Please try again.',
      honeypotLabel: 'Leave this field empty',
      privacy: {
        href: '/host-privacy',
        label: 'Privacy information',
        target: '_blank',
      },
    },
  },
};
export default meta;
type Story = StoryObj<NewsletterSignup>;
export const Idle: Story = {};
export const Submitting: Story = { args: { busy: true } };
export const Accepted: Story = { args: { accepted: true } };
export const Retry: Story = {
  args: { failureMessage: 'Unable to send. Please try again.' },
};
export const Localized: Story = {
  args: {
    policy: {
      version: 'voorbeeld/v1',
      text: 'Ik ga akkoord met het ontvangen van de nieuwsbrief.',
    },
    presentation: {
      heading: 'Nieuwsbrief',
      emailLabel: 'E-mailadres',
      submitLabel: 'Inschrijven',
      submittingMessage: 'Bezig met verzenden…',
      successMessage: 'Je aanvraag is ontvangen.',
      invalidEmailMessage: 'Vul een geldig e-mailadres in.',
      consentRequiredMessage: 'Geef eerst je toestemming.',
      invalidRequestMessage: 'Controleer je gegevens.',
      rateLimitedMessage: 'Probeer het later opnieuw.',
      unavailableMessage: 'Verzenden mislukt.',
      honeypotLabel: 'Laat dit veld leeg',
    },
  },
};
