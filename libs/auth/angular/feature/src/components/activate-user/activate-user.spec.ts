import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsFeatureActivateUser } from './activate-user';

describe('AnarchitectsFeatureActivateUser', () => {
  let component: AnarchitectsFeatureActivateUser;
  let fixture: ComponentFixture<AnarchitectsFeatureActivateUser>;
  let ref: ComponentRef<AnarchitectsFeatureActivateUser>;
  const mockAuthStore = {
    activateUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureActivateUser],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureActivateUser);
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

  it('should use form payload token before input token', async () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'activate-user',
      formVersion: 1,
      payload: { token: 'manual-token' },
    };

    await component.submitForm(submission);

    expect(mockAuthStore.activateUser).toHaveBeenCalledWith({
      token: 'manual-token',
    });
  });

  it('should fallback to token input when payload token is missing', async () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    const submission: SubmissionRequestDTO = {
      formId: 'activate-user',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.activateUser).toHaveBeenCalledWith({
      token: 'prefilled-token',
    });
  });

  it('should skip submit when token cannot be resolved', async () => {
    const submission: SubmissionRequestDTO = {
      formId: 'activate-user',
      formVersion: 1,
      payload: {},
    };

    await component.submitForm(submission);

    expect(mockAuthStore.activateUser).not.toHaveBeenCalled();
  });
});
