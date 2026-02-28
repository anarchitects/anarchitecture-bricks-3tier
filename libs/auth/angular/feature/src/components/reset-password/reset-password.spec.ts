import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureResetPassword } from './reset-password';

describe('AnarchitectsFeatureResetPassword', () => {
  let component: AnarchitectsFeatureResetPassword;
  let fixture: ComponentFixture<AnarchitectsFeatureResetPassword>;
  let ref: ComponentRef<AnarchitectsFeatureResetPassword>;
  const mockAuthStore = {
    resetPassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureResetPassword],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureResetPassword);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose reset-password form config with password fields', () => {
    expect(component.formConfig().fields).toEqual([
      {
        name: 'token',
        kind: 'string',
        required: true,
        minLength: 1,
        ui: { label: 'Reset Token' },
      },
      {
        name: 'password',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Password' },
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

  it('should use token input fallback when payload token is missing', async () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'reset-password',
      formVersion: 1,
      payload: {
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.resetPassword).toHaveBeenCalledWith({
      dto: {
        token: 'prefilled-token',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    });
  });

  it('should map payload token and call AuthStore.resetPassword', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'reset-password',
      formVersion: 1,
      payload: {
        token: 'manual-token',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.resetPassword).toHaveBeenCalledWith({
      dto: {
        token: 'manual-token',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    });
  });

  it('should skip submit when token cannot be resolved', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'reset-password',
      formVersion: 1,
      payload: {
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.resetPassword).not.toHaveBeenCalled();
  });
});
