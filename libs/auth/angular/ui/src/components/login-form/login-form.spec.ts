import { Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { SchemaPath, validate } from '@angular/forms/signals';
import { AnarchitectsAuthUiLoginForm } from './login-form';

describe('AnarchitectsAuthUiLoginForm', () => {
  let component: AnarchitectsAuthUiLoginForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiLoginForm>;

  const setup = async (providers: Provider[] = []) => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiLoginForm],
      providers,
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiLoginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await setup();
  });

  const getLoginControls = () => {
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const credentialInput = nativeElement.querySelector(
      'input#credential',
    ) as HTMLInputElement | null;
    const passwordInput = nativeElement.querySelector(
      'input#password',
    ) as HTMLInputElement | null;
    const submitButton = nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    if (!credentialInput || !passwordInput || !submitButton) {
      throw new Error('Expected login form controls to be rendered.');
    }

    return { nativeElement, credentialInput, passwordInput, submitButton };
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose login form config', () => {
    expect(component.formConfig().id).toBe('login');
    expect(component.formConfig().fields).toHaveLength(2);
  });

  it('should read contract-driven password minLength', async () => {
    await setup(
      provideAuthContracts({
        login: {
          password: {
            minLength: 10,
          },
        },
      }),
    );

    expect(
      component.formConfig().fields.find((field) => field.name === 'password')
        ?.minLength,
    ).toBe(10);
  });

  it('should keep submit disabled when required login fields are missing by default', async () => {
    const { credentialInput, submitButton } = getLoginControls();

    credentialInput.value = 'user@example.com';
    credentialInput.dispatchEvent(new Event('input'));
    credentialInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(true);
  });

  it('should allow submit when password is optional under a custom profile', async () => {
    await setup(
      provideAuthContracts({
        login: {
          password: {
            required: false,
          },
        },
      }),
    );

    const { credentialInput, submitButton } = getLoginControls();

    credentialInput.value = 'user@example.com';
    credentialInput.dispatchEvent(new Event('input'));
    credentialInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show the contract-driven password minLength validation message', async () => {
    await setup(
      provideAuthContracts({
        login: {
          password: {
            minLength: 10,
          },
        },
      }),
    );

    const { nativeElement, credentialInput, passwordInput, submitButton } =
      getLoginControls();

    credentialInput.value = 'user@example.com';
    credentialInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'short';
    passwordInput.dispatchEvent(new Event('input'));
    passwordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('Minimum length is 10.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should apply Signal Forms schema extensions', async () => {
    const blockedCredential: FormsSchemaExtension = (path) => {
      validate(path['credential'] as SchemaPath<string>, ({ value }) =>
        value() === 'blocked@example.com'
          ? {
              kind: 'blockedCredential',
              message: 'This account is blocked.',
            }
          : undefined,
      );
    };
    fixture.componentRef.setInput('schemaExtensions', [blockedCredential]);
    fixture.detectChanges();
    await fixture.whenStable();

    const { nativeElement, credentialInput, passwordInput, submitButton } =
      getLoginControls();
    credentialInput.value = 'blocked@example.com';
    credentialInput.dispatchEvent(new Event('input'));
    credentialInput.dispatchEvent(new Event('blur'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement.textContent).toContain('This account is blocked.');
    expect(submitButton.disabled).toBe(true);
  });

  it('should submit the mapped payload and reset Signal Forms state', async () => {
    let emitted: LoginRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });
    const { credentialInput, passwordInput, submitButton } = getLoginControls();

    credentialInput.value = 'user@example.com';
    credentialInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(submitButton.disabled).toBe(false);

    submitButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(emitted).toEqual({
      credential: 'user@example.com',
      password: 'secret123',
    });
    expect(credentialInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(submitButton.disabled).toBe(true);
  });

  it('should map submission payload to LoginRequestDTO', () => {
    let emitted: LoginRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'login',
      formVersion: 1,
      payload: { credential: 'user@example.com', password: 'secret123' },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      credential: 'user@example.com',
      password: 'secret123',
    });
  });
});
