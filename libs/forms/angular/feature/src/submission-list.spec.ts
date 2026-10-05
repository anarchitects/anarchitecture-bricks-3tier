import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ComponentRef,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { AnarchitectsFeatureSubmissionList } from './submission-list';
import { AnarchitectsFeatureSubmissionDetail } from './submission-detail';

describe('AnarchitectsFeatureSubmissionList', () => {
  let component: AnarchitectsFeatureSubmissionList;
  let fixture: ComponentFixture<AnarchitectsFeatureSubmissionList>;
  let ref: ComponentRef<AnarchitectsFeatureSubmissionList>;

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
      imports: [
        AnarchitectsFeatureSubmissionList,
        AnarchitectsFeatureSubmissionDetail,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: FormsStore, useValue: mockFormsStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureSubmissionList);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    await fixture.whenStable();
  });

  it('should consume the enclosing store and render all submissions by default', () => {
    expect(component).toBeTruthy();
    expect(fixture.debugElement.injector.get(FormsStore)).toBe(
      TestBed.inject(FormsStore),
    );
    expect(component.submissions()).toEqual(submissions);
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(2);
  });

  it('should filter submissions by form id when provided', async () => {
    ref.setInput('formId', 'contact');
    await fixture.whenStable();

    expect(component.submissions()).toHaveLength(1);
    expect(component.submissions()[0].formId).toBe('contact');
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('article').textContent,
    ).toContain('contact');
  });

  it('should emit selected submission from UI event', async () => {
    const emitSpy = vi.spyOn(component.selected, 'emit');

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(emitSpy).toHaveBeenCalledWith(mockSubmissions()[0]);
  });

  it('should render an empty list when no submissions match the form id', async () => {
    ref.setInput('formId', 'missing');
    await fixture.whenStable();

    expect(component.submissions()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      'No submissions found.',
    );
  });

  it('should share externally provided state with submission detail', async () => {
    const detail = TestBed.createComponent(AnarchitectsFeatureSubmissionDetail);
    await detail.whenStable();

    expect(detail.debugElement.injector.get(FormsStore)).toBe(
      fixture.debugElement.injector.get(FormsStore),
    );

    mockSubmissions.set([submissions[1]]);
    await fixture.whenStable();
    await detail.whenStable();

    expect(component.submissions()).toEqual([submissions[1]]);
    expect(detail.componentInstance.submission()).toBe(submissions[1]);
    expect(
      fixture.nativeElement.querySelector('article').textContent,
    ).toContain('feedback');
    expect(detail.nativeElement.querySelector('dd').textContent).toContain(
      'Hello',
    );
  });
});
