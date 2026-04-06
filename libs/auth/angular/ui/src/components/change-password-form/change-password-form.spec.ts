import { Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiChangePasswordForm } from './change-password-form';

describe('AnarchitectsAuthUiChangePasswordForm', () => {
  let component: AnarchitectsAuthUiChangePasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiChangePasswordForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiChangePasswordForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiChangePasswordForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  const getChangePasswordControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const currentPasswordInput = nativeElement.querySelector(
      'input#currentPassword',
    ) as HTMLInputElement | null;
    const newPasswordInput = nativeElement.querySelector(
      'input#newPassword',
    ) as HTMLInputElement | null;
    const confirmPasswordInput = nativeElement.querySelector(
      'input#confirmPassword',
    ) as HTMLInputElement | null;
    const submitButton = nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    if (
      !currentPasswordInput ||
      !newPasswordInput ||
      !confirmPasswordInput ||
      !submitButton
    ) {
      throw new Error('Expected change-password form controls to be rendered.');
    }

    return {
      nativeElement,
      currentPasswordInput,
      newPasswordInput,
      confirmPasswordInput,
      submitButton,
    };
  };

  it('should configure confirmPassword to match newPassword', () => {
    expect(component.formConfig().validationRules).toEqual([
      {
        kind: 'matchFields',
        sourceField: 'newPassword',
        targetField: 'confirmPassword',
        message: 'Passwords must match.',
      },
    ]);
  });

  it('should read contract-driven password metadata', async () => {
    await setup(
      provideAuthContracts({
        changePassword: {
          confirmPassword: {
            required: false,
          },
          newPassword: {
            minLength: 10,
          },
        },
      }),
    );

    expect(
      component
        .formConfig()
        .fields.find((field) => field.name === 'confirmPassword')?.required,
    ).toBe(false);
    expect(
      component
        .formConfig()
        .fields.find((field) => field.name === 'newPassword')?.minLength,
    ).toBe(10);
  });

  it('should keep submit disabled when required change-password fields are missing by default', async () => {
    const { currentPasswordInput, submitButton } = getChangePasswordControls();

    currentPasswordInput.value = 'old-password';
    currentPasswordInput.dispatchEvent(new Event('input'));
    currentPasswordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
  });

  it('should allow submit when confirmPassword is optional and omitted', async () => {
    await setup(
      provideAuthContracts({
        changePassword: {
          confirmPassword: {
            required: false,
          },
        },
      }),
    );

    const { currentPasswordInput, newPasswordInput, submitButton } =
      getChangePasswordControls();

    currentPasswordInput.value = 'old-password';
    currentPasswordInput.dispatchEvent(new Event('input'));
    newPasswordInput.value = 'new-password';
    newPasswordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show the contract-driven newPassword minLength validation message', async () => {
    await setup(
      provideAuthContracts({
        changePassword: {
          newPassword: {
            minLength: 10,
          },
        },
      }),
    );

    const {
      nativeElement,
      currentPasswordInput,
      newPasswordInput,
      confirmPasswordInput,
      submitButton,
    } = getChangePasswordControls();

    currentPasswordInput.value = 'old-password';
    currentPasswordInput.dispatchEvent(new Event('input'));
    newPasswordInput.value = 'short';
    newPasswordInput.dispatchEvent(new Event('input'));
    newPasswordInput.dispatchEvent(new Event('blur'));
    confirmPasswordInput.value = 'short';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Minimum length is 10.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should map submission payload to ChangePasswordRequestDTO', () => {
    let emitted: ChangePasswordRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'change-password',
      formVersion: 1,
      payload: {
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });
  });
});
