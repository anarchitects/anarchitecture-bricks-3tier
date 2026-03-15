import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { jwtDecode } from 'jwt-decode';
import { AnarchitectsFeatureChangePassword } from './change-password';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

describe('AnarchitectsFeatureChangePassword', () => {
  let component: AnarchitectsFeatureChangePassword;
  let fixture: ComponentFixture<AnarchitectsFeatureChangePassword>;
  let ref: ComponentRef<AnarchitectsFeatureChangePassword>;
  const mockAuthStore = {
    loggedInUser: jest.fn(),
    changePassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureChangePassword],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureChangePassword);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should map and call AuthStore.changePassword with input userId', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    const input: ChangePasswordRequestDTO = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    };

    await component.submitForm(input);

    expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
      userId: 'input-user-id',
      dto: input,
    });
  });

  it('should fallback to decoded access token sub for userId', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);
    localStorage.setItem('accessToken', 'access-token');
    jest.mocked(jwtDecode).mockReturnValue({ sub: 'decoded-user-id' });

    await component.submitForm({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });

    expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
      userId: 'decoded-user-id',
      dto: {
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      },
    });
  });

  it('should skip submit when userId cannot be resolved', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);

    await component.submitForm({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });

    expect(mockAuthStore.changePassword).not.toHaveBeenCalled();
  });
});
