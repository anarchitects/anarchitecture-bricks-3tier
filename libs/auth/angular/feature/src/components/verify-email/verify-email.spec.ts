import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureVerifyEmail } from './verify-email';

describe('AnarchitectsFeatureVerifyEmail', () => {
  let component: AnarchitectsFeatureVerifyEmail;
  let fixture: ComponentFixture<AnarchitectsFeatureVerifyEmail>;
  let ref: ComponentRef<AnarchitectsFeatureVerifyEmail>;
  const mockAuthStore = {
    verifyEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureVerifyEmail],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureVerifyEmail);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require token when token input is not provided', () => {
    expect(component.formConfig().fields[0]?.required).toBe(true);
  });

  it('should not require token when token input is provided', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    expect(component.formConfig().fields[0]?.required).toBe(false);
  });

  it('should map payload token and call AuthStore.verifyEmail', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'verify-email',
      formVersion: 1,
      payload: { token: 'manual-token' },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.verifyEmail).toHaveBeenCalledWith({
      token: 'manual-token',
    });
  });

  it('should fallback to token input when payload token is missing', async () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.verifyEmail).toHaveBeenCalledWith({
      token: 'prefilled-token',
    });
  });

  it('should skip submit when token cannot be resolved', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.verifyEmail).not.toHaveBeenCalled();
  });
});
