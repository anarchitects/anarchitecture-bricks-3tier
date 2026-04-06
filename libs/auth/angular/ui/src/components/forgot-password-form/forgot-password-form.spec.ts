import { Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiForgotPasswordForm } from './forgot-password-form';

describe('AnarchitectsAuthUiForgotPasswordForm', () => {
  let component: AnarchitectsAuthUiForgotPasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiForgotPasswordForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiForgotPasswordForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiForgotPasswordForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  const getForgotPasswordControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const emailInput = nativeElement.querySelector(
      'input#email',
    ) as HTMLInputElement | null;
    const submitButton = nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    if (!emailInput || !submitButton) {
      throw new Error('Expected forgot-password form controls to be rendered.');
    }

    return { nativeElement, emailInput, submitButton };
  };

  it('should read contract-driven email required metadata', async () => {
    await setup(
      provideAuthContracts({
        forgotPassword: {
          email: {
            required: false,
          },
        },
      }),
    );

    expect(component.formConfig().fields[0]?.required).toBe(false);
  });

  it('should keep submit disabled when email is missing by default', async () => {
    const { emailInput, submitButton } = getForgotPasswordControls();

    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
  });

  it('should allow submit without email when the field is optional', async () => {
    await setup(
      provideAuthContracts({
        forgotPassword: {
          email: {
            required: false,
          },
        },
      }),
    );

    const { submitButton } = getForgotPasswordControls();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should still validate email format when a value is provided', async () => {
    await setup(
      provideAuthContracts({
        forgotPassword: {
          email: {
            required: false,
          },
        },
      }),
    );

    const { nativeElement, emailInput, submitButton } =
      getForgotPasswordControls();

    emailInput.value = 'not-an-email';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Enter a valid email address.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should map submission payload to ForgotPasswordRequestDTO', () => {
    let emitted: ForgotPasswordRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'forgot-password',
      formVersion: 1,
      payload: { email: 'user@example.com' },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({ email: 'user@example.com' });
  });
});
