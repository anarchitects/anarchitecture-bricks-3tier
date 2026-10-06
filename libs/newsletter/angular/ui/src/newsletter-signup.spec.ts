import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NewsletterSignup } from './newsletter-signup';
import type { NewsletterSignupPresentation } from '@anarchitects/newsletter-angular/config';

const presentation: NewsletterSignupPresentation = {
  heading: 'Host newsletter',
  description: 'Host introduction',
  emailLabel: 'Your email',
  submitLabel: 'Join',
  submittingMessage: 'Sending',
  successMessage: 'Request received',
  invalidEmailMessage: 'Check your email',
  consentRequiredMessage: 'Please agree',
  invalidRequestMessage: 'Check your details',
  rateLimitedMessage: 'Try later',
  unavailableMessage: 'Unable to send',
  honeypotLabel: 'Leave empty',
  privacy: { href: '/host-privacy', label: 'Privacy', target: '_blank' },
};

describe('NewsletterSignup Forms composition', () => {
  let fixture: ComponentFixture<NewsletterSignup>;
  let component: NewsletterSignup;
  let element: HTMLElement;
  function control<T extends HTMLElement = HTMLElement>(selector: string): T {
    const node = element.querySelector<T>(selector);
    if (!node) throw new Error(`Missing control: ${selector}`);
    return node;
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterSignup],
    }).compileComponents();
    fixture = TestBed.createComponent(NewsletterSignup);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('idPrefix', 'footer-news');
    fixture.componentRef.setInput('policy', {
      version: 'policy/v1',
      text: 'Host consent wording',
    });
    fixture.componentRef.setInput('presentation', presentation);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement;
  });
  async function enter(email: string, consent = true, website = '') {
    const input = control<HTMLInputElement>('input[type=email]');
    input.value = email;
    input.dispatchEvent(new Event('input'));
    if (control<HTMLInputElement>('input[type=checkbox]').checked !== consent)
      control<HTMLInputElement>('input[type=checkbox]').click();
    const trap = control<HTMLInputElement>('input[type=text]');
    trap.value = website;
    trap.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }
  async function click() {
    control<HTMLButtonElement>('button').click();
    await fixture.whenStable();
  }
  it('renders configured accessible labels, policy, privacy and an unchecked consent control', () => {
    expect(element.querySelector('h2')?.textContent).toBe(presentation.heading);
    expect(element.textContent).toContain('Host consent wording');
    expect(control<HTMLInputElement>('input[type=checkbox]').checked).toBe(
      false,
    );
    expect(element.querySelector('label[for=footer-news-email]')).toBeTruthy();
    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      '/host-privacy',
    );
    expect(element.querySelector('a')?.getAttribute('target')).toBe('_blank');
    expect(element.querySelector('a')?.getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
    expect(element.querySelector('form')?.method).toBe('post');
    expect(element.querySelector('button')?.type).toBe('button');
    expect(
      element.querySelector<HTMLInputElement>('input[type=text]')?.tabIndex,
    ).toBe(-1);
    expect(
      element.querySelector('input[type=text]')?.closest('[aria-hidden=true]'),
    ).toBeTruthy();
  });
  it('uses Forms validation and exposes host errors without emitting invalid requests', async () => {
    const emit = vi.spyOn(component.signupRequested, 'emit');
    await enter('invalid', false);
    await click();
    expect(emit).not.toHaveBeenCalled();
    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      presentation.invalidEmailMessage,
    );
    expect(
      element.querySelector('input[type=email]')?.getAttribute('aria-invalid'),
    ).toBe('true');
    expect(
      element
        .querySelector('input[type=email]')
        ?.getAttribute('aria-describedby'),
    ).toBe('footer-news-error');
    await enter('reader@example.test', false);
    await click();
    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      presentation.consentRequiredMessage,
    );
    expect(emit).not.toHaveBeenCalled();
  });
  it('submits the Newsletter DTO on Enter with the rendered consent version and honeypot', async () => {
    const emit = vi.spyOn(component.signupRequested, 'emit');
    await enter('reader@example.test', true, 'bot-value');
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    control('input[type=email]').dispatchEvent(event);
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(emit).toHaveBeenCalledExactlyOnceWith({
      email: 'reader@example.test',
      consent: true,
      consentVersion: 'policy/v1',
      website: 'bot-value',
    });
    expect(component.renderer()?.formModel()['email']).toBe(
      'reader@example.test',
    );
  });
  it('disables controls while pending and announces neutral acceptance', async () => {
    await enter('reader@example.test');
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    expect(element.querySelector<HTMLButtonElement>('button')?.disabled).toBe(
      true,
    );
    expect(
      element.querySelector<HTMLInputElement>('input[type=email]')?.disabled,
    ).toBe(true);
    expect(element.querySelector('[role=status]')?.textContent).toContain(
      presentation.submittingMessage,
    );
    const emit = vi.spyOn(component.signupRequested, 'emit');
    await click();
    expect(emit).not.toHaveBeenCalled();
    fixture.componentRef.setInput('accepted', true);
    fixture.componentRef.setInput('busy', false);
    await fixture.whenStable();
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('[role=status]')?.textContent).toContain(
      presentation.successMessage,
    );
  });
  it('clears consent when the displayed policy changes', async () => {
    await enter('reader@example.test');
    fixture.componentRef.setInput('policy', {
      version: 'policy/v2',
      text: 'New wording',
    });
    await fixture.whenStable();
    expect(
      element.querySelector<HTMLInputElement>('input[type=checkbox]')?.checked,
    ).toBe(false);
    expect(element.textContent).toContain('New wording');
    const emit = vi.spyOn(component.signupRequested, 'emit');
    component.emitSignup({
      formId: 'newsletter:policy/v1:Host consent wording',
      formVersion: 1,
      payload: { email: 'reader@example.test', consent: true, website: '' },
    });
    expect(emit).not.toHaveBeenCalled();
  });
});
