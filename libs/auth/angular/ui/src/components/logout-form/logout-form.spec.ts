import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiLogoutForm } from './logout-form';

describe('AnarchitectsAuthUiLogoutForm', () => {
  let component: AnarchitectsAuthUiLogoutForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiLogoutForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiLogoutForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiLogoutForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should emit an empty logout dto for core session logout', () => {
    let emitted: Record<string, never> | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'logout',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({});
  });

  it('should emit even without any locally stored tokens', () => {
    let emitted: Record<string, never> | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    component.onSubmitted({ formId: 'logout', formVersion: 1, payload: {} });

    expect(emitted).toEqual({});
  });
});
