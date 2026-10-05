import { provideFormsDefaults } from '@anarchitects/forms-angular/config';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { Submission } from '@anarchitects/forms-ts/models';
import {
  toSubmissionRequestDTO,
  toSubmissionResponseDTO,
} from '@anarchitects/forms-ts/mappers';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  AnarchitectsFeatureSubmissionDetail,
  AnarchitectsFeatureSubmissionList,
  provideFormsSubmissionsFeature,
} from './index';

@Component({
  imports: [
    AnarchitectsFeatureSubmissionList,
    AnarchitectsFeatureSubmissionDetail,
  ],
  providers: [...provideFormsSubmissionsFeature()],
  template: `
    <anarchitects-forms-feature-submission-list
      [formId]="formId()"
      (selected)="selectedId.set($event.id)"
    />
    <anarchitects-forms-feature-submission-detail
      [submissionId]="selectedId()"
    />
  `,
})
class SubmissionsHost {
  readonly formId = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);
}

const submissions: Submission[] = [
  {
    id: 'contact-1',
    formId: 'contact',
    formVersion: 1,
    payload: { name: 'Jane Doe' },
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  },
  {
    id: 'feedback-1',
    formId: 'feedback',
    formVersion: 1,
    payload: { message: 'Hello' },
    createdAt: new Date('2026-01-02T10:00:00.000Z'),
    updatedAt: new Date('2026-01-02T10:00:00.000Z'),
  },
];

function recordSubmissions(
  store: InstanceType<typeof FormsStore>,
  entries: Submission[],
): void {
  const http = TestBed.inject(HttpTestingController);
  for (const entry of entries) {
    store.submitForm(toSubmissionRequestDTO(entry));
    http
      .expectOne({ method: 'POST', url: '/api/forms/submit' })
      .flush(toSubmissionResponseDTO(entry));
  }
}

describe('provideFormsSubmissionsFeature public entry point', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SubmissionsHost],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideFormsDefaults(),
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shares one real store between list and detail under a host provider', async () => {
    const fixture = TestBed.createComponent(SubmissionsHost);
    const store = fixture.debugElement.injector.get(FormsStore);
    recordSubmissions(store, submissions);
    await fixture.whenStable();

    const list = fixture.debugElement.query(
      By.directive(AnarchitectsFeatureSubmissionList),
    );
    const detail = fixture.debugElement.query(
      By.directive(AnarchitectsFeatureSubmissionDetail),
    );

    expect(list.injector.get(FormsStore)).toBe(store);
    expect(detail.injector.get(FormsStore)).toBe(store);
    expect(list.componentInstance.submissions()).toEqual(submissions);
    expect(detail.componentInstance.submission()).toEqual(submissions[0]);
    expect(detail.nativeElement.textContent).toContain('Jane Doe');

    list.nativeElement.querySelectorAll('button')[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedId()).toBe('feedback-1');
    expect(detail.componentInstance.submission()).toEqual(submissions[1]);
    expect(detail.nativeElement.textContent).toContain('Hello');
  });

  it('keeps filtering and detail resolution reactive to shared state changes', async () => {
    const fixture = TestBed.createComponent(SubmissionsHost);
    const store = fixture.debugElement.injector.get(FormsStore);
    fixture.componentInstance.formId.set('feedback');
    fixture.componentInstance.selectedId.set('feedback-1');
    recordSubmissions(store, [submissions[0]]);
    await fixture.whenStable();

    const list = fixture.debugElement.query(
      By.directive(AnarchitectsFeatureSubmissionList),
    );
    const detail = fixture.debugElement.query(
      By.directive(AnarchitectsFeatureSubmissionDetail),
    );
    expect(list.componentInstance.submissions()).toEqual([]);
    expect(detail.componentInstance.submission()).toBeNull();
    expect(list.nativeElement.textContent).toContain('No submissions found.');
    expect(detail.nativeElement.textContent).toContain(
      'Select a submission to view details.',
    );

    recordSubmissions(store, [submissions[1]]);
    await fixture.whenStable();

    expect(list.componentInstance.submissions()).toEqual([submissions[1]]);
    expect(list.nativeElement.querySelectorAll('button')).toHaveLength(1);
    expect(detail.componentInstance.submission()).toEqual(submissions[1]);
    expect(detail.nativeElement.textContent).toContain('Hello');
  });

  it('isolates separate host scopes without registering a global store', async () => {
    const first = TestBed.createComponent(SubmissionsHost);
    const second = TestBed.createComponent(SubmissionsHost);
    const firstStore = first.debugElement.injector.get(FormsStore);
    const secondStore = second.debugElement.injector.get(FormsStore);
    recordSubmissions(firstStore, submissions);
    await first.whenStable();
    await second.whenStable();

    expect(firstStore).not.toBe(secondStore);
    expect(firstStore.submissionsEntities()).toEqual(submissions);
    expect(secondStore.submissionsEntities()).toEqual([]);
    expect(second.nativeElement.textContent).toContain('No submissions found.');
    expect(TestBed.inject(FormsStore, null)).toBeNull();
  });
});
