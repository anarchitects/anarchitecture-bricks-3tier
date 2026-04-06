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
