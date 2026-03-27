import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiRegisterForm } from './register-form';

describe('AnarchitectsAuthUiRegisterForm', () => {
  let component: AnarchitectsAuthUiRegisterForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiRegisterForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiRegisterForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiRegisterForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should map submission payload to RegisterRequestDTO', () => {
    let emitted: RegisterRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'register',
      formVersion: 1,
      payload: {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('should block submission when password confirmation does not match', async () => {
    let emitted: RegisterRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const emailInput = nativeElement.querySelector(
      'input#email',
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

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();

    emailInput!.value = 'jane@example.com';
    emailInput!.dispatchEvent(new Event('input'));
    passwordInput!.value = 'secret123';
    passwordInput!.dispatchEvent(new Event('input'));
    confirmPasswordInput!.value = 'secret124';
    confirmPasswordInput!.dispatchEvent(new Event('input'));
    confirmPasswordInput!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton?.disabled).toBe(true);
    expect(nativeElement.textContent).toContain('Passwords must match.');

    submitButton?.click();
    fixture.detectChanges();

    expect(emitted).toBeUndefined();
  });
});
