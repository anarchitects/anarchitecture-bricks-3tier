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

  it('should map submission payload to RegisterRequestDTO', () => {
    let emitted: RegisterRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'register',
      formVersion: 1,
      payload: {
        userName: 'Jane',
        email: 'jane@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      userName: 'Jane',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });
});
