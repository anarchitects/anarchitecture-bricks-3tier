import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiRefreshTokensForm } from './refresh-tokens-form';

describe('AnarchitectsAuthUiRefreshTokensForm', () => {
  let component: AnarchitectsAuthUiRefreshTokensForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiRefreshTokensForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiRefreshTokensForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiRefreshTokensForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should emit refresh dto using local storage fallback token', () => {
    localStorage.setItem('refreshToken', 'stored-refresh-token');

    let emitted: RefreshTokenRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: {},
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({ refreshToken: 'stored-refresh-token' });
  });

  it('should not emit when refresh token cannot be resolved', () => {
    let emitted: RefreshTokenRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    component.onSubmitted({
      formId: 'refresh-tokens',
      formVersion: 1,
      payload: {},
    });

    expect(emitted).toBeUndefined();
  });
});
