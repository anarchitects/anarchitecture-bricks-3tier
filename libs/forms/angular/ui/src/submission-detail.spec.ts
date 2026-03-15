import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { AnarchitectsFormsUiSubmissionDetail } from './submission-detail';

describe('AnarchitectsFormsUiSubmissionDetail', () => {
  let component: AnarchitectsFormsUiSubmissionDetail;
  let fixture: ComponentFixture<AnarchitectsFormsUiSubmissionDetail>;
  let ref: ComponentRef<AnarchitectsFormsUiSubmissionDetail>;

  const mockSubmission: Submission = {
    id: 'submission-1',
    formId: 'contact',
    formVersion: 1,
    payload: { name: 'Jane Doe', email: 'jane@example.com' },
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFormsUiSubmissionDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFormsUiSubmissionDetail);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state when no submission is selected', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).toContain('Select a submission');
  });

  it('should render submission details', () => {
    ref.setInput('submission', mockSubmission);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    expect(nativeElement.textContent).toContain('contact');
    expect(nativeElement.textContent).toContain('Jane Doe');
    expect(nativeElement.textContent).toContain('jane@example.com');
  });
});
