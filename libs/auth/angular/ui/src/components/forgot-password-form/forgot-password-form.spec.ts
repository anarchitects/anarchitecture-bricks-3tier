import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiForgotPasswordForm } from './forgot-password-form';

describe('AnarchitectsAuthUiForgotPasswordForm', () => {
  let component: AnarchitectsAuthUiForgotPasswordForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiForgotPasswordForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiForgotPasswordForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiForgotPasswordForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
