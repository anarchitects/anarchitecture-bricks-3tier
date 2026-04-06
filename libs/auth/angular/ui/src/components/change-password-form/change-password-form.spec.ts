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
