import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureLogout } from './logout';

describe('AnarchitectsFeatureLogout', () => {
  let component: AnarchitectsFeatureLogout;
  let fixture: ComponentFixture<AnarchitectsFeatureLogout>;
  const mockAuthStore = {
    logout: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureLogout],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureLogout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose logout form config', () => {
    expect(component.formConfig()).toEqual({
      id: 'logout',
      version: 1,
      fields: [
        {
          name: 'refreshToken',
          kind: 'string',
          required: false,
          minLength: 1,
          ui: { label: 'Refresh Token' },
        },
        {
          name: 'accessToken',
          kind: 'string',
          required: false,
          minLength: 1,
          ui: { label: 'Access Token (optional)' },
        },
      ],
    });
  });

  it('should map payload and call AuthStore.logout', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'logout',
      formVersion: 1,
      payload: {
        refreshToken: 'refresh-token',
        accessToken: 'access-token',
      },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.logout).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
    });
  });

  it('should fallback to localStorage tokens', async () => {
    localStorage.setItem('refreshToken', 'stored-refresh-token');
    localStorage.setItem('accessToken', 'stored-access-token');

    const submission: SubmissionRequestDTO = {
      formId: 'logout',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.logout).toHaveBeenCalledWith({
      refreshToken: 'stored-refresh-token',
      accessToken: 'stored-access-token',
    });
  });

  it('should skip submit when refresh token cannot be resolved', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'logout',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.logout).not.toHaveBeenCalled();
  });
});
