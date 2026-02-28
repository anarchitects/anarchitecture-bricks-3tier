import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureRegister } from './register';

describe('AnarchitectsFeatureRegister', () => {
  let component: AnarchitectsFeatureRegister;
  let fixture: ComponentFixture<AnarchitectsFeatureRegister>;
  const mockAuthStore = {
    registerUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureRegister],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureRegister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep password fields configured as password kind', () => {
    const fields = component.formConfig().fields;
    expect(fields.find((field) => field.name === 'password')?.kind).toBe(
      'password'
    );
    expect(fields.find((field) => field.name === 'confirmPassword')?.kind).toBe(
      'password'
    );
  });

  it('should map payload and call AuthStore.registerUser', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'register',
      formVersion: 1,
      payload: {
        userName: 'testuser',
        email: 'test@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.registerUser).toHaveBeenCalledWith({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });
});
