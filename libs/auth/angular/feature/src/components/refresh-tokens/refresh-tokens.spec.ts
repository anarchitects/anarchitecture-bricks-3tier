import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose refresh-tokens form config', () => {
    expect(component.formConfig()).toEqual({
      id: 'refresh-tokens',
      version: 1,
      fields: [
        {
          name: 'refreshToken',
          kind: 'string',
          required: false,
          minLength: 1,
          ui: { label: 'Refresh Token' },
        },
      ],
    });
  });

  it('should map payload and call AuthStore.refreshTokens with input userId', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: { refreshToken: 'manual-refresh-token' },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.refreshTokens).toHaveBeenCalledWith({
      userId: 'input-user-id',
      dto: { refreshToken: 'manual-refresh-token' },
    });
  });

  it('should fallback to localStorage refresh token and decoded userId', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);
    localStorage.setItem('refreshToken', 'stored-refresh-token');
    localStorage.setItem('accessToken', 'access-token');
    jest.mocked(jwtDecode).mockReturnValue({ sub: 'decoded-user-id' });

    const submission: SubmissionRequestDTO = {
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.refreshTokens).toHaveBeenCalledWith({
      userId: 'decoded-user-id',
      dto: { refreshToken: 'stored-refresh-token' },
    });
  });

  it('should skip submit when userId cannot be resolved', async () => {
    mockAuthStore.loggedInUser.mockReturnValue(undefined);

    const submission: SubmissionRequestDTO = {
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: { refreshToken: 'manual-refresh-token' },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
  });

  it('should skip submit when refresh token cannot be resolved', async () => {
    ref.setInput('userId', 'input-user-id');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
  });
});
