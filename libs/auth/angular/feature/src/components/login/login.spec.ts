import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureLogin } from './login';

describe('AnarchitectsFeatureLogin', () => {
  let component: AnarchitectsFeatureLogin;
  let fixture: ComponentFixture<AnarchitectsFeatureLogin>;
  const mockAuthStore = {
    login: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureLogin],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose login form config with expected fields', () => {
    expect(component.formConfig()).toEqual({
      id: 'login',
      version: 1,
      fields: [
        {
          name: 'credential',
          kind: 'string',
          required: true,
          minLength: 2,
          maxLength: 100,
          ui: { label: 'Email or Username' },
        },
        {
          name: 'password',
          kind: 'password',
          required: true,
          minLength: 6,
          ui: { label: 'Password' },
        },
      ],
    });
  });

  it('should map payload and call AuthStore.login', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'login',
      formVersion: 1,
      payload: {
        credential: 'user@example.com',
        password: 'secret123',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.login).toHaveBeenCalledWith({
      credential: 'user@example.com',
      password: 'secret123',
    });
  });
});
