import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ComponentRef,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { AnarchitectsFeatureSubmissionDetail } from './submission-detail';

describe('AnarchitectsFeatureSubmissionDetail', () => {
  let component: AnarchitectsFeatureSubmissionDetail;
  let fixture: ComponentFixture<AnarchitectsFeatureSubmissionDetail>;
  let ref: ComponentRef<AnarchitectsFeatureSubmissionDetail>;

  const submissions: Submission[] = [
    {
      id: 'submission-1',
      formId: 'contact',
      formVersion: 1,
      payload: { name: 'Jane Doe' },
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    },
    {
      id: 'submission-2',
      formId: 'feedback',
      formVersion: 1,
      payload: { message: 'Hello' },
      createdAt: new Date('2026-01-02T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T10:00:00.000Z'),
    },
  ];
  const mockSubmissions = signal(submissions);

  const mockFormsStore = {
    submissionsEntities: mockSubmissions,
  };

  beforeEach(async () => {
    mockSubmissions.set(submissions);
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureSubmissionDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: FormsStore, useValue: mockFormsStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureSubmissionDetail);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should consume the enclosing store', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.injector.get(FormsStore)).toBe(
      TestBed.inject(FormsStore),
    );
  });

  it('should resolve submission by id when provided', async () => {
    ref.setInput('submissionId', 'submission-2');
    await fixture.whenStable();

    expect(component.submission()?.id).toBe('submission-2');
    expect(fixture.nativeElement.querySelector('dd').textContent).toContain(
      'Hello',
    );
  });

  it('should fallback to first submission when no id is provided', () => {
    expect(component.submission()?.id).toBe('submission-1');
    expect(fixture.nativeElement.querySelector('dd').textContent).toContain(
      'Jane Doe',
    );
  });

  it('should show the empty state for an unknown id rather than falling back', async () => {
    ref.setInput('submissionId', 'missing');
    await fixture.whenStable();

    expect(component.submission()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('Select a submission to view details.');
  });

  it('should show the empty state when the enclosing store has no submissions', async () => {
    mockSubmissions.set([]);
    await fixture.whenStable();

    expect(component.submission()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('Select a submission to view details.');
  });
});
