import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import {
  toUpdateUserProfileRequest,
  UserProfileEditor,
} from './user-profile-editor';

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

describe('UserProfileEditor', () => {
  let component: UserProfileEditor;
  let fixture: ComponentFixture<UserProfileEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileEditor],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('profile', profile);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize a non-null signal form model from the profile', () => {
    expect(component.model()).toEqual({
      displayName: 'Ada Lovelace',
      givenName: 'Ada',
      familyName: 'Lovelace',
      avatarUrl: '',
      locale: 'en-GB',
      timeZone: 'Europe/London',
    });
  });

  it('should emit a shared update DTO and normalize empty values to null', async () => {
    let submitted: UpdateUserProfileRequestDTO | undefined;
    component.profileSubmitted.subscribe((dto) => {
      submitted = dto;
    });
    component.model.update((model) => ({
      ...model,
      displayName: '  Countess of Lovelace  ',
      avatarUrl: '   ',
    }));

    component.submit();
    await fixture.whenStable();

    expect(submitted).toEqual({
      displayName: 'Countess of Lovelace',
      givenName: 'Ada',
      familyName: 'Lovelace',
      avatarUrl: null,
      locale: 'en-GB',
      timeZone: 'Europe/London',
    });
  });

  it('should reset editable state when a different profile is supplied', async () => {
    component.model.update((model) => ({ ...model, displayName: 'Draft' }));

    fixture.componentRef.setInput('profile', {
      ...profile,
      id: 'profile-2',
      displayName: 'Grace Hopper',
    });
    await fixture.whenStable();

    expect(component.model().displayName).toBe('Grace Hopper');
  });

  it('should map every blank form value to a nullable API field', () => {
    expect(
      toUpdateUserProfileRequest({
        displayName: '',
        givenName: '',
        familyName: '',
        avatarUrl: '',
        locale: '',
        timeZone: '',
      }),
    ).toEqual({
      displayName: null,
      givenName: null,
      familyName: null,
      avatarUrl: null,
      locale: null,
      timeZone: null,
    });
  });
});
