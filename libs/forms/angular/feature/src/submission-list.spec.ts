import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef, signal } from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { AnarchitectsFeatureSubmissionList } from './submission-list';

describe('AnarchitectsFeatureSubmissionList', () => {
  let component: AnarchitectsFeatureSubmissionList;
  let fixture: ComponentFixture<AnarchitectsFeatureSubmissionList>;
  let ref: ComponentRef<AnarchitectsFeatureSubmissionList>;

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
      imports: [AnarchitectsFeatureSubmissionList],
    })
      .overrideComponent(AnarchitectsFeatureSubmissionList, {
        set: {
          providers: [{ provide: FormsStore, useValue: mockFormsStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureSubmissionList);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter submissions by form id when provided', () => {
    ref.setInput('formId', 'contact');
    fixture.detectChanges();

    expect(component.submissions()).toHaveLength(1);
    expect(component.submissions()[0].formId).toBe('contact');
  });

  it('should emit selected submission from UI event', () => {
    const emitSpy = vi.spyOn(component.selected, 'emit');

    component.onSelected(mockSubmissions()[0]);

    expect(emitSpy).toHaveBeenCalledWith(mockSubmissions()[0]);
  });
});
