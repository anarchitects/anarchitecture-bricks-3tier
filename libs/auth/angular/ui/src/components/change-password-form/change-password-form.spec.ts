import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiChangePasswordForm } from './change-password-form';

describe('AnarchitectsAuthUiChangePasswordForm', () => {
  let component: AnarchitectsAuthUiChangePasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiChangePasswordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiChangePasswordForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiChangePasswordForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
