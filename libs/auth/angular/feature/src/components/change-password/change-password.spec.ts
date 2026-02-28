import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { jwtDecode } from 'jwt-decode';
import { AnarchitectsFeatureChangePassword } from './change-password';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

describe('AnarchitectsFeatureChangePassword', () => {
  let component: AnarchitectsFeatureChangePassword;
  let fixture: ComponentFixture<AnarchitectsFeatureChangePassword>;
  let ref: ComponentRef<AnarchitectsFeatureChangePassword>;
  const mockAuthStore = {
    loggedInUser: jest.fn(),
    changePassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureChangePassword],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureChangePassword);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose change-password form config with password fields', () => {
    expect(component.formConfig().fields).toEqual([
      {
        name: 'currentPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Current Password' },
      },
      {
        name: 'newPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'New Password' },
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Confirm Password' },
      },
    ]);
  });

  it('should prioritize userId input over other fallbacks', async () => {
    ref.setInput('userId', 'input-user-id');
    mockAuthStore.loggedInUser.mockReturnValue({ id: 'store-user-id' });
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'change-password',
      formVersion: 1,
      payload: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
      userId: 'input-user-id',
      dto: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    });
  });

  it('should fallback to AuthStore.loggedInUser().id', async () => {
    mockAuthStore.loggedInUser.mockReturnValue({ id: 'store-user-id' });

    const submission: SubmissionRequestDTO = {
      formId: 'change-password',
      formVersion: 1,
      payload: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
      userId: 'store-user-id',
      dto: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    });
  });

  it('should fallback to decoded access token sub', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);
    localStorage.setItem('accessToken', 'access-token');
    jest.mocked(jwtDecode).mockReturnValue({ sub: 'decoded-user-id' });

    const submission: SubmissionRequestDTO = {
      formId: 'change-password',
      formVersion: 1,
      payload: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
      userId: 'decoded-user-id',
      dto: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    });
  });

  it('should skip submit when userId cannot be resolved', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);

    const submission: SubmissionRequestDTO = {
      formId: 'change-password',
      formVersion: 1,
      payload: {
        currentPassword: 'old12345',
        newPassword: 'new12345',
        confirmPassword: 'new12345',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.changePassword).not.toHaveBeenCalled();
  });
});
