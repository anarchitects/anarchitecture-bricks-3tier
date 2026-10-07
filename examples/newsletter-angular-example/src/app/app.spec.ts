import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { App } from './app';

describe('Newsletter host', () => {
  beforeEach(async () => {
    window.history.replaceState(null, '', '/');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    window.history.replaceState(null, '', '/');
  });
  it('renders the Forms-backed signup with explicit, unchecked host consent', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain(
      'I agree to receive the example newsletter',
    );
    expect(
      root.querySelector<HTMLInputElement>('input[type=checkbox]')?.checked,
    ).toBe(false);
    TestBed.inject(HttpTestingController).expectNone(
      '/api/newsletter/subscribe',
    );
  });
  it.each(['confirm', 'unsubscribe'])(
    'requires an explicit action on the %s landing page and retries a failed POST',
    async (action) => {
      window.history.replaceState(null, '', `/${action}?token=fixture-secret`);
      const fixture = TestBed.createComponent(App);
      fixture.autoDetectChanges();
      await fixture.whenStable();
      const http = TestBed.inject(HttpTestingController);
      http.expectNone(`/api/newsletter/${action}`);
      expect(window.location.search).toBe('');
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        'button',
      );
      button?.click();
      const first = http.expectOne(`/api/newsletter/${action}`);
      expect(first.request.method).toBe('POST');
      expect(first.request.body).toEqual({ token: 'fixture-secret' });
      first.flush({}, { status: 503, statusText: 'Unavailable' });
      await fixture.whenStable();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[role=alert]'),
      ).not.toBeNull();
      button?.click();
      http.expectOne(`/api/newsletter/${action}`).flush({ accepted: true });
      await fixture.whenStable();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[role=status]')
          ?.textContent,
      ).toContain('Request received');
    },
  );
});
