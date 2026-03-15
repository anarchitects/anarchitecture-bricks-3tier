import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiActivateUserForm } from './activate-user-form';

describe('AnarchitectsAuthUiActivateUserForm', () => {
  let component: AnarchitectsAuthUiActivateUserForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiActivateUserForm>;
  let ref: ComponentRef<AnarchitectsAuthUiActivateUserForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiActivateUserForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiActivateUserForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should require token when input token is missing', () => {
    expect(component.formConfig().fields[0]?.required).toBe(true);
  });

  it('should use input token fallback when payload token is missing', () => {
    ref.setInput('token', 'prefilled-token');
    fixture.detectChanges();

    let emitted: ActivateUserRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'activate-user',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({ token: 'prefilled-token' });
  });

  it('should not emit when token cannot be resolved', () => {
    let emitted: ActivateUserRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'activate-user',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toBeUndefined();
  });
});
