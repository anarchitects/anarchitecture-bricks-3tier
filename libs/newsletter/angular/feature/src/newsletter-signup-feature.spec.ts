import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NewsletterSignupFeature } from './newsletter-signup-feature';
import { provideNewsletterFeature } from './providers';
import type { NewsletterSignupPresentation } from '@anarchitects/newsletter-angular/config';

const copy: NewsletterSignupPresentation = {
  heading: 'Updates',
  emailLabel: 'Email',
  submitLabel: 'Join',
  submittingMessage: 'Sending',
  successMessage: 'Request received',
  invalidEmailMessage: 'Invalid email',
  consentRequiredMessage: 'Agree first',
  invalidRequestMessage: 'Check details',
  rateLimitedMessage: 'Try later',
  unavailableMessage: 'Try again',
  honeypotLabel: 'Leave empty',
};
describe('NewsletterSignupFeature', () => {
  let fixture: ComponentFixture<NewsletterSignupFeature>;
  let http: HttpTestingController;
  let element: HTMLElement;
  function control<T extends HTMLElement = HTMLElement>(selector: string): T {
    const node = element.querySelector<T>(selector);
    if (!node) throw new Error(`Missing control: ${selector}`);
    return node;
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterSignupFeature],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideNewsletterFeature({
          apiBaseUrl: '/api',
          consent: { version: 'v1', text: 'Receive host updates' },
        }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NewsletterSignupFeature);
    fixture.componentRef.setInput('idPrefix', 'feature-news');
    fixture.componentRef.setInput('presentation', copy);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement;
    http.expectNone('/api/newsletter/subscribe');
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  async function submit() {
    const email = control<HTMLInputElement>('input[type=email]');
    email.value = 'reader@example.test';
    email.dispatchEvent(new Event('input'));
    const consent = control<HTMLInputElement>('input[type=checkbox]');
    if (!consent.checked) consent.click();
    await fixture.whenStable();
    control<HTMLButtonElement>('button').click();
    // HTTP timeout is a pending Zone task: inspect/flush the request before waiting for stability.
    await Promise.resolve();
    fixture.detectChanges();
    return http.expectOne('/api/newsletter/subscribe');
  }
  it('connects the Forms UI to scoped Newsletter state and JSON POST, suppressing duplicates', async () => {
    fixture.componentRef.setInput('source', 'host-footer');
    const request = await submit();
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'reader@example.test',
      consent: true,
      consentVersion: 'v1',
      website: '',
      source: 'host-footer',
    });
    expect(element.querySelector('[role=status]')?.textContent).toContain(
      copy.submittingMessage,
    );
    control<HTMLButtonElement>('button').click();
    http.expectNone('/api/newsletter/subscribe');
    request.flush({ accepted: true, subscriberStatus: 'already-present' });
    await fixture.whenStable();
    expect(element.querySelector('[role=status]')?.textContent).toContain(
      copy.successMessage,
    );
    expect(element.textContent).not.toContain('already-present');
    expect(element.querySelector('form')).toBeNull();
  });
  it.each([
    [400, 'Check details'],
    [429, 'Try later'],
    [503, 'Try again'],
  ])(
    'maps HTTP %s to host copy and retains fields for retry',
    async (status, message) => {
      const request = await submit();
      expect(request.request.body.source).toBeUndefined();
      request.flush(
        { message: 'sensitive upstream details' },
        { status: Number(status), statusText: 'Failure' },
      );
      await fixture.whenStable();
      expect(element.querySelector('[role=alert]')?.textContent).toContain(
        message,
      );
      expect(element.textContent).not.toContain('sensitive');
      expect(
        element.querySelector<HTMLInputElement>('input[type=email]')?.value,
      ).toBe('reader@example.test');
      expect(
        element.querySelector<HTMLInputElement>('input[type=checkbox]')
          ?.checked,
      ).toBe(true);
      const retry = await submit();
      retry.flush({ accepted: true });
      await fixture.whenStable();
      expect(fixture.componentInstance.store.status()).toBe('success');
    },
  );
});
