import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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

  it('should delegate forgot-password action to AuthStore', async () => {
    const input: ForgotPasswordRequestDTO = { email: 'user@example.com' };

    await component.submitForm(input);

    expect(mockAuthStore.forgotPassword).toHaveBeenCalledWith(input);
  });
});
