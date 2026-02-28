import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureForgotPassword } from './forgot-password';

describe('AnarchitectsFeatureForgotPassword', () => {
  let component: AnarchitectsFeatureForgotPassword;
  let fixture: ComponentFixture<AnarchitectsFeatureForgotPassword>;
  const mockAuthStore = {
    forgotPassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureForgotPassword],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose forgot-password form config', () => {
    expect(component.formConfig()).toEqual({
      id: 'forgot-password',
      version: 1,
      fields: [
        {
          name: 'email',
          kind: 'email',
          required: true,
          ui: { label: 'Email' },
        },
      ],
    });
  });

  it('should map payload and call AuthStore.forgotPassword', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'forgot-password',
      formVersion: 1,
      payload: { email: 'user@example.com' },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.forgotPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
  });
});
