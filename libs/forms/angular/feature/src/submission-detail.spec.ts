import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef, signal } from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { AnarchitectsFeatureSubmissionDetail } from './submission-detail';

describe('AnarchitectsFeatureSubmissionDetail', () => {
  let component: AnarchitectsFeatureSubmissionDetail;
  let fixture: ComponentFixture<AnarchitectsFeatureSubmissionDetail>;
  let ref: ComponentRef<AnarchitectsFeatureSubmissionDetail>;

  const mockSubmissions = signal<Submission[]>([
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
  ]);

  const mockFormsStore = {
    submissionsEntities: mockSubmissions,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureSubmissionDetail],
    })
      .overrideComponent(AnarchitectsFeatureSubmissionDetail, {
        set: {
          providers: [{ provide: FormsStore, useValue: mockFormsStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureSubmissionDetail);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve submission by id when provided', () => {
    ref.setInput('submissionId', 'submission-2');
    fixture.detectChanges();

    expect(component.submission()?.id).toBe('submission-2');
  });

  it('should fallback to first submission when no id is provided', () => {
    expect(component.submission()?.id).toBe('submission-1');
  });
});
