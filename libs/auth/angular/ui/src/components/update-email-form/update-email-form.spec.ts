import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { AnarchitectsAuthUiUpdateEmailForm } from './update-email-form';

describe('AnarchitectsAuthUiUpdateEmailForm', () => {
  let component: AnarchitectsAuthUiUpdateEmailForm;
  let fixture: ComponentFixture<AnarchitectsAuthUiUpdateEmailForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthUiUpdateEmailForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthUiUpdateEmailForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should map submission payload to UpdateEmailRequestDTO', () => {
    let emitted: UpdateEmailRequestDTO | undefined;
    component.submitted.subscribe((value) => {
      emitted = value;
    });

    const submission: SubmissionRequestDTO = {
      formId: 'update-email',
      formVersion: 1,
      payload: {
        newEmail: 'next@example.com',
        password: 'secret123',
      },
    };

    component.onSubmitted(submission);

    expect(emitted).toEqual({
      newEmail: 'next@example.com',
      password: 'secret123',
    });
  });
});
