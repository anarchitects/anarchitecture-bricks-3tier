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

  const getResetPasswordControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const tokenInput = nativeElement.querySelector(
      'input#token',
    ) as HTMLInputElement | null;
    const passwordInput = nativeElement.querySelector(
      'input#password',
    ) as HTMLInputElement | null;
    const confirmPasswordInput = nativeElement.querySelector(
      'input#confirmPassword',
    ) as HTMLInputElement | null;
    const submitButton = nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    if (
      !tokenInput ||
      !passwordInput ||
      !confirmPasswordInput ||
      !submitButton
    ) {
      throw new Error('Expected reset-password form controls to be rendered.');
    }

    return {
      nativeElement,
      tokenInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
    };
  };

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

  it('should keep submit disabled when required reset-password fields are missing by default', async () => {
    const { passwordInput, submitButton } = getResetPasswordControls();

    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    passwordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
  });

  it('should allow submit without token when the custom profile makes it optional', async () => {
    await setup(
      provideAuthContracts({
        resetPassword: {
          token: {
            required: false,
          },
        },
      }),
    );

    const { passwordInput, confirmPasswordInput, submitButton } =
      getResetPasswordControls();

    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show the contract-driven token minLength validation message', async () => {
    await setup(
      provideAuthContracts({
        resetPassword: {
          token: {
            required: false,
            minLength: 8,
          },
        },
      }),
    );

    const {
      nativeElement,
      tokenInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
    } = getResetPasswordControls();

    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    tokenInput.value = 'short';
    tokenInput.dispatchEvent(new Event('input'));
    tokenInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Minimum length is 8.');
    expect(submitButton.disabled).toBe(true);
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
