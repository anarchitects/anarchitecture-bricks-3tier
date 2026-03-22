import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureResetPassword } from './reset-password';

describe('AnarchitectsFeatureResetPassword', () => {
  let component: AnarchitectsFeatureResetPassword;
  let fixture: ComponentFixture<AnarchitectsFeatureResetPassword>;
  const mockAuthStore = {
    resetPassword: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureResetPassword],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate reset-password action to AuthStore', async () => {
    const input: ResetPasswordRequestDTO = {
      token: 'manual-token',
      password: 'secret123',
      confirmPassword: 'secret123',
    };

    await component.submitForm(input);

    expect(mockAuthStore.resetPassword).toHaveBeenCalledWith({ dto: input });
  });

  it('should skip submit when token is empty', async () => {
    await component.submitForm({
      token: '',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    expect(mockAuthStore.resetPassword).not.toHaveBeenCalled();
  });
});
