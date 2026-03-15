import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiResetPasswordForm } from './reset-password-form';

describe('AnarchitectsAuthUiResetPasswordForm', () => {
  let component: AnarchitectsAuthUiResetPasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiResetPasswordForm>;
  let ref: ComponentRef<AnarchitectsAuthUiResetPasswordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiResetPasswordForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiResetPasswordForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should map payload token and password fields', () => {
    let emitted: ResetPasswordRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'reset-password',
      formVersion: 1,
      payload: {
        token: 'manual-token',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      token: 'manual-token',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('should use token input fallback when payload token is missing', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    let emitted: ResetPasswordRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'reset-password',
      formVersion: 1,
      payload: {
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    component.onSubmitted(submission);

    expect(emitted?.token).toBe('prefilled-token');
  });
});
