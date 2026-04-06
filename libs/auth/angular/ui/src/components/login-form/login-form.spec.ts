import { Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
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
