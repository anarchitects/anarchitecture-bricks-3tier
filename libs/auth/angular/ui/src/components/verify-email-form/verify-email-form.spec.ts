import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiVerifyEmailForm } from './verify-email-form';

describe('AnarchitectsAuthUiVerifyEmailForm', () => {
  let component: AnarchitectsAuthUiVerifyEmailForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiVerifyEmailForm>;
  let ref: ComponentRef<AnarchitectsAuthUiVerifyEmailForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiVerifyEmailForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiVerifyEmailForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should use token input fallback when payload token is missing', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    let emitted: VerifyEmailRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({ token: 'prefilled-token' });
  });

  it('should not emit when token cannot be resolved', () => {
    let emitted: VerifyEmailRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    component.onSubmitted({
      formId: 'verify-email',
      formVersion: 1,
      payload: {},
    });

    expect(emitted).toBeUndefined();
  });
});
