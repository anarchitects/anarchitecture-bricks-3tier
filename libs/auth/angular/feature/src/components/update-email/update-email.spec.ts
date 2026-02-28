import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { jwtDecode } from 'jwt-decode';
import { AnarchitectsFeatureUpdateEmail } from './update-email';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

describe('AnarchitectsFeatureUpdateEmail', () => {
  let component: AnarchitectsFeatureUpdateEmail;
  let fixture: ComponentFixture<AnarchitectsFeatureUpdateEmail>;
  let ref: ComponentRef<AnarchitectsFeatureUpdateEmail>;
  const mockAuthStore = {
    loggedInUser: jest.fn(),
    updateEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureUpdateEmail],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureUpdateEmail);
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

  it('should expose update-email form config', () => {
    expect(component.formConfig()).toEqual({
      id: 'update-email',
      version: 1,
      fields: [
        {
          name: 'newEmail',
          kind: 'email',
          required: true,
          ui: { label: 'New Email' },
        },
        {
          name: 'password',
          kind: 'password',
          required: true,
          minLength: 6,
          ui: { label: 'Password' },
        },
      ],
    });
  });

  it('should map payload and call AuthStore.updateEmail with input userId', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'update-email',
      formVersion: 1,
      payload: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.updateEmail).toHaveBeenCalledWith({
      userId: 'input-user-id',
      dto: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    });
  });

  it('should fallback to decoded access token sub for userId', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);
    localStorage.setItem('accessToken', 'access-token');
    jest.mocked(jwtDecode).mockReturnValue({ sub: 'decoded-user-id' });

    const submission: SubmissionRequestDTO = {
      formId: 'update-email',
      formVersion: 1,
      payload: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.updateEmail).toHaveBeenCalledWith({
      userId: 'decoded-user-id',
      dto: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    });
  });

  it('should skip submit when userId cannot be resolved', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);

    const submission: SubmissionRequestDTO = {
      formId: 'update-email',
      formVersion: 1,
      payload: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.updateEmail).not.toHaveBeenCalled();
  });
});
