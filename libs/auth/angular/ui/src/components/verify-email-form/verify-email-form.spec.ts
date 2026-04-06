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
