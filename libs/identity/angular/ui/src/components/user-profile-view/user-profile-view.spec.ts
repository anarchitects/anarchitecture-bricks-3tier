import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { UserProfileResponseDTO } from '@anarchitects/identity-ts';
import { UserProfileView } from './user-profile-view';

const profile: UserProfileResponseDTO = {
  id: 'profile-1',
  authUserId: 'auth-user-1',
  displayName: 'Ada Lovelace',
  givenName: 'Ada',
  familyName: 'Lovelace',
  avatarUrl: 'https://example.test/ada.png',
  locale: 'en-GB',
  timeZone: 'Europe/London',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('UserProfileView', () => {
  let component: UserProfileView;
  let fixture: ComponentFixture<UserProfileView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileView],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileView);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render profile information and an accessible avatar', () => {
    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector('img');

    expect(element.textContent).toContain('Ada Lovelace');
    expect(element.textContent).toContain('Europe/London');
    expect(image?.getAttribute('alt')).toBe('Ada Lovelace profile avatar');
  });
});
