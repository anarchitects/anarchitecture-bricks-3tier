import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  provideAuthConfig,
  provideAuthContracts,
} from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAuthConfig({ apiResourcePath: 'auth' }),
        provideAuthContracts(),
        provideAuthState({ restoreOnInit: false }),
      ],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain(
      'Auth Angular example',
    );
    expect(compiled.querySelector('nav')).toBeTruthy();
    expect(
      compiled.querySelector('[data-consumer-mode="advanced"]'),
    ).toBeTruthy();
    expect(compiled.querySelector('[data-density="compact"]')).toBeTruthy();
  });
});
