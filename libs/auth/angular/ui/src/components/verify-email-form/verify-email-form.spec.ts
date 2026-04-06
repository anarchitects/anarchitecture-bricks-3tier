import { ComponentRef, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiVerifyEmailForm } from './verify-email-form';

describe('AnarchitectsAuthUiVerifyEmailForm', () => {
  let component: AnarchitectsAuthUiVerifyEmailForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiVerifyEmailForm>;
  let ref: ComponentRef<AnarchitectsAuthUiVerifyEmailForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiVerifyEmailForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiVerifyEmailForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  const getVerifyEmailControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const tokenInput = nativeElement.querySelector(
      'input#token',
    ) as HTMLInputElement | null;
    const submitButton = nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    if (!tokenInput || !submitButton) {
      throw new Error('Expected verify-email form controls to be rendered.');
    }

    return { nativeElement, tokenInput, submitButton };
  };

  it('should read contract-driven token minLength', async () => {
    await setup(
      provideAuthContracts({
        verifyEmail: {
          token: {
            minLength: 8,
          },
        },
      }),
    );

    expect(component.formConfig().fields[0]?.minLength).toBe(8);
  });

  it('should keep submit disabled when token is missing by default', async () => {
    const { tokenInput, submitButton } = getVerifyEmailControls();

    tokenInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
  });

  it('should allow submit without token when the custom profile makes it optional', async () => {
    await setup(
      provideAuthContracts({
        verifyEmail: {
          token: {
            required: false,
          },
        },
      }),
    );

    const { submitButton } = getVerifyEmailControls();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show the contract-driven token minLength validation message', async () => {
    await setup(
      provideAuthContracts({
        verifyEmail: {
          token: {
            required: false,
            minLength: 8,
          },
        },
      }),
    );

    const { nativeElement, tokenInput, submitButton } =
      getVerifyEmailControls();

    tokenInput.value = 'short';
    tokenInput.dispatchEvent(new Event('input'));
    tokenInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Minimum length is 8.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should use token input fallback when payload token is missing', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    let emitted: VerifyEmailRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({ token: 'prefilled-token' });
  });

  it('should keep the token field optional in UI when a token input is prefilled', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    expect(component.formConfig().fields[0]?.required).toBe(false);
  });

  it('should not emit when token cannot be resolved', () => {
    let emitted: VerifyEmailRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    component.onSubmitted({
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    });

    expect(emitted).toBeUndefined();
  });
});
