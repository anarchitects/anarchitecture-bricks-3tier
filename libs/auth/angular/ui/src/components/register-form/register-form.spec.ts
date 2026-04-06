import { Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiRegisterForm } from './register-form';

describe('AnarchitectsAuthUiRegisterForm', () => {
  let component: AnarchitectsAuthUiRegisterForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiRegisterForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiRegisterForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiRegisterForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  const getRegisterControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const nameInput = nativeElement.querySelector(
      'input#name',
    ) as HTMLInputElement | null;
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

    if (
      !nameInput ||
      !emailInput ||
      !passwordInput ||
      !confirmPasswordInput ||
      !submitButton
    ) {
      throw new Error('Expected register form controls to be rendered.');
    }

    return {
      nativeElement,
      nameInput,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
    };
  };

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

  it('should read contract-driven required metadata for name', async () => {
    await setup(
      provideAuthContracts({
        register: {
          name: {
            required: true,
          },
        },
      }),
    );

    expect(
      component.formConfig().fields.find((field) => field.name === 'name')
        ?.required,
    ).toBe(true);
  });

  it('should allow submit without name by default', async () => {
    const { emailInput, passwordInput, confirmPasswordInput, submitButton } =
      getRegisterControls();

    emailInput.value = 'jane@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should require name when the custom profile marks it required', async () => {
    await setup(
      provideAuthContracts({
        register: {
          name: {
            required: true,
          },
        },
      }),
    );

    const {
      nativeElement,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      nameInput,
      submitButton,
    } = getRegisterControls();

    emailInput.value = 'jane@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    nameInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('This field is required.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should show the contract-driven name minLength validation message', async () => {
    await setup(
      provideAuthContracts({
        register: {
          name: {
            minLength: 5,
          },
        },
      }),
    );

    const {
      nativeElement,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      nameInput,
      submitButton,
    } = getRegisterControls();

    emailInput.value = 'jane@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    nameInput.value = 'Joe';
    nameInput.dispatchEvent(new Event('input'));
    nameInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Minimum length is 5.');
    expect(submitButton.disabled).toBe(true);
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

    const {
      nativeElement,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      submitButton,
    } = getRegisterControls();

    emailInput.value = 'jane@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.value = 'secret124';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
    expect(nativeElement.textContent).toContain('Passwords must match.');

    submitButton.click();
    fixture.detectChanges();

    expect(emitted).toBeUndefined();
  });
});
