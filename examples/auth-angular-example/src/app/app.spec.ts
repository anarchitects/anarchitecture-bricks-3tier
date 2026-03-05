import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  const mockStore = {
    isLoggedIn: jest.fn(() => false),
    loggedInUser: jest.fn(() => undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthStore, useValue: mockStore }],
    }).compileComponents();
  });

  it('renders the application title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Auth Angular Example',
    );
  });

  it('renders the guarded admin navigation link', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = [...compiled.querySelectorAll('a')].map((el) =>
      el.textContent?.trim(),
    );
    expect(links).toContain('Admin (Guarded)');
  });
});
