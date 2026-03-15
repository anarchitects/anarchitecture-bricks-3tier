import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
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

  it('should emit logout dto using local storage fallback tokens', () => {
    localStorage.setItem('refreshToken', 'stored-refresh-token');
    localStorage.setItem('accessToken', 'stored-access-token');

    let emitted: LogoutRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'logout',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      refreshToken: 'stored-refresh-token',
      accessToken: 'stored-access-token',
    });
  });

  it('should not emit when refresh token cannot be resolved', () => {
    let emitted: LogoutRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    component.onSubmitted({ formId: 'logout', formVersion: 1, payload: {} });

    expect(emitted).toBeUndefined();
  });
});
