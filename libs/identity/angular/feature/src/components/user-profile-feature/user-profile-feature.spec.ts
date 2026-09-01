import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { IdentityStore } from '@anarchitects/identity-angular/state';
import { UserProfileEditor } from '@anarchitects/identity-angular/ui';
import type { UserProfileResponseDTO } from '@anarchitects/identity-ts';
import { UserProfileFeature } from './user-profile-feature';

const profile: UserProfileResponseDTO = {
  id: 'profile-1',
  authUserId: 'auth-user-1',
  displayName: 'Ada Lovelace',
  givenName: 'Ada',
  familyName: 'Lovelace',
  avatarUrl: null,
  locale: 'en-GB',
  timeZone: 'Europe/London',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('UserProfileFeature', () => {
  let component: UserProfileFeature;
  let fixture: ComponentFixture<UserProfileFeature>;
  const profileState = signal<UserProfileResponseDTO | null>(profile);
  const loadingState = signal(false);
  const savingState = signal(false);
  const errorState = signal<string | null>(null);
  const store = {
    profile: profileState.asReadonly(),
    loading: loadingState.asReadonly(),
    saving: savingState.asReadonly(),
    error: errorState.asReadonly(),
    loadProfile: vi.fn().mockResolvedValue(profile),
    updateProfile: vi.fn().mockResolvedValue(profile),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    profileState.set(profile);
    loadingState.set(false);
    savingState.set(false);
    errorState.set(null);

    await TestBed.configureTestingModule({
      imports: [UserProfileFeature],
      providers: [{ provide: IdentityStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileFeature);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authUserId', 'auth-user-1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the requested user profile and render the feature', () => {
    expect(store.loadProfile).toHaveBeenCalledWith('auth-user-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Ada Lovelace',
    );
  });

  it('should pass editor submissions to the profile store', () => {
    const editor = fixture.debugElement.query(By.directive(UserProfileEditor))
      .componentInstance as UserProfileEditor;
    const dto = { displayName: 'Countess of Lovelace' };

    editor.profileSubmitted.emit(dto);

    expect(store.updateProfile).toHaveBeenCalledWith(dto);
  });

  it('should render loading and failure state accessibly', async () => {
    loadingState.set(true);
    errorState.set('Profile unavailable');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Loading profile',
    );
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Profile unavailable',
    );
  });
});
