import { ComponentRef, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiResetPasswordForm } from './reset-password-form';

describe('AnarchitectsAuthUiResetPasswordForm', () => {
  let component: AnarchitectsAuthUiResetPasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiResetPasswordForm>;
  let ref: ComponentRef<AnarchitectsAuthUiResetPasswordForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiResetPasswordForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiResetPasswordForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  it('should configure confirmPassword to match password', () => {
    expect(component.formConfig().validationRules).toEqual([
      {
        kind: 'matchFields',
        sourceField: 'password',
        targetField: 'confirmPassword',
        message: 'Passwords must match.',
      },
    ]);
  });

  it('should read contract-driven token minLength', async () => {
    await setup(
      provideAuthContracts({
        resetPassword: {
          token: {
            minLength: 8,
          },
        },
      }),
    );

    expect(
      component.formConfig().fields.find((field) => field.name === 'token')
        ?.minLength,
    ).toBe(8);
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

  it('should keep the token field optional in UI when a token input is prefilled', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    expect(
      component.formConfig().fields.find((field) => field.name === 'token')
        ?.required,
    ).toBe(false);
  });
});
