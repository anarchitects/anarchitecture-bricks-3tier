import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import { jwtDecode } from 'jwt-decode';
import { AnarchitectsFeatureRefreshTokens } from './refresh-tokens';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

describe('AnarchitectsFeatureRefreshTokens', () => {
  let component: AnarchitectsFeatureRefreshTokens;
  let fixture: ComponentFixture<AnarchitectsFeatureRefreshTokens>;
  let ref: ComponentRef<AnarchitectsFeatureRefreshTokens>;
  const mockAuthStore = {
    loggedInUser: jest.fn(),
    refreshTokens: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureRefreshTokens],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureRefreshTokens);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should call AuthStore.refreshTokens with input userId', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    const input: RefreshTokenRequestDTO = { refreshToken: 'refresh-token' };

    await component.submitForm(input);

    expect(mockAuthStore.refreshTokens).toHaveBeenCalledWith({
      userId: 'input-user-id',
      dto: input,
    });
  });

  it('should fallback to decoded access token sub for userId', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);
    localStorage.setItem('accessToken', 'access-token');
    jest.mocked(jwtDecode).mockReturnValue({ sub: 'decoded-user-id' });

    await component.submitForm({ refreshToken: 'refresh-token' });

    expect(mockAuthStore.refreshTokens).toHaveBeenCalledWith({
      userId: 'decoded-user-id',
      dto: { refreshToken: 'refresh-token' },
    });
  });

  it('should skip submit when userId cannot be resolved', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);

    await component.submitForm({ refreshToken: 'refresh-token' });

    expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
  });

  it('should skip submit when refresh token is empty', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    await component.submitForm({ refreshToken: '' });

    expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
  });
});
