import { provideFormsConfig } from '@anarchitects/forms-angular/config';
import { FormsStore } from '@anarchitects/forms-angular/state';
import {
  AnarchitectsFormsUiSubmissionDetail,
  AnarchitectsFormsUiSubmissionList,
} from '@anarchitects/forms-angular/ui';
import { SubmissionResponseDTO } from '@anarchitects/forms-ts/dtos';
import { Submission } from '@anarchitects/forms-ts/models';
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  AnarchitectsFeatureSubmissionsAdmin,
  provideFormsSubmissionsFeature,
} from './index';

@Component({
  imports: [AnarchitectsFeatureSubmissionsAdmin],
  providers: [...provideFormsSubmissionsFeature()],
  template: `
    <anarchitects-forms-feature-submissions-admin
      [formId]="formId()"
      [formVersion]="formVersion()"
      [submissionId]="submissionId()"
      listTitle="Saved responses"
      detailTitle="Response details"
      listLayout="forms:grid"
      [listLayoutOptions]="{ columns: 2 }"
      detailLayout="forms:detail"
      (selected)="onSelected($event)"
    />
  `,
})
class SubmissionsPage {
  readonly formId = signal<string | undefined>(undefined);
  readonly formVersion = signal<number | undefined>(undefined);
  readonly submissionId = signal<string | null | undefined>(undefined);
  readonly onSelected = vi.fn<(submission: Submission) => void>();
}

const first: SubmissionResponseDTO = {
  id: '01900000-0000-7000-8000-000000000001',
  formId: 'contact',
  formVersion: 1,
  payload: { message: 'First message' },
  createdAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T10:00:00.000Z',
};
const second: SubmissionResponseDTO = {
  ...first,
  id: '01900000-0000-7000-8000-000000000002',
  formId: 'feedback',
  formVersion: 2,
  payload: { message: 'Second message' },
};
const url = '/custom-api/forms/submissions';

function click(
  fixture: ComponentFixture<SubmissionsPage>,
  label: string,
): void {
  const button = Array.from(
    fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>,
  ).find((candidate) => candidate.textContent?.trim() === label);
  expect(button, `Expected button: ${label}`).toBeDefined();
  button?.click();
}

function panes(fixture: ComponentFixture<SubmissionsPage>) {
  return {
    list: fixture.debugElement.query(
      By.directive(AnarchitectsFormsUiSubmissionList),
    ),
    detail: fixture.debugElement.query(
      By.directive(AnarchitectsFormsUiSubmissionDetail),
    ),
  };
}

describe('Submissions admin public composition', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SubmissionsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideFormsConfig({ apiBaseUrl: '/custom-api/' }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the list and selected detail through one host-provided store and the public HTTP adapter', async () => {
    const fixture = TestBed.createComponent(SubmissionsPage);
    await fixture.whenStable();
    const store = fixture.debugElement.injector.get(FormsStore);
    expect(fixture.nativeElement.textContent).toContain('Loading submissions');
    http.expectOne({ method: 'GET', url }).flush([first, second]);
    await fixture.whenStable();
    const { list, detail } = panes(fixture);
    expect(list.injector.get(FormsStore)).toBe(store);
    expect(detail.injector.get(FormsStore)).toBe(store);
    expect(TestBed.inject(FormsStore, null)).toBeNull();
    expect(list.componentInstance.submissions()).toHaveLength(2);
    expect(detail.componentInstance.submission()).toBeNull();
    expect(list.componentInstance.title()).toBe('Saved responses');
    expect(list.componentInstance.layout()).toBe('forms:grid');
    expect(list.componentInstance.layoutOptions()).toEqual({ columns: 2 });
    expect(detail.componentInstance.title()).toBe('Response details');
    expect(detail.componentInstance.layout()).toBe('forms:detail');

    list.nativeElement.querySelectorAll('button')[1].click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Loading submission details',
    );
    expect(fixture.componentInstance.onSelected).toHaveBeenCalledWith(
      expect.objectContaining({ id: second.id, createdAt: expect.any(Date) }),
    );
    http
      .expectOne({ method: 'GET', url: `${url}/${second.id}` })
      .flush({ ...second, payload: { message: 'Fresh details' } });
    await fixture.whenStable();
    expect(store.selectedSubmissionId()).toBe(second.id);
    expect(detail.nativeElement.textContent).toContain('Fresh details');
    expect(list.componentInstance.submissions()[1]).toBe(
      store.selectedSubmission(),
    );
  });

  it('loads initial filters once and refreshes when either filter changes or clears', async () => {
    const fixture = TestBed.createComponent(SubmissionsPage);
    fixture.componentInstance.formId.set('contact');
    fixture.componentInstance.formVersion.set(1);
    await fixture.whenStable();
    http.expectOne(`${url}?formId=contact&formVersion=1`).flush([first]);
    await fixture.whenStable();
    fixture.componentInstance.formId.set('feedback');
    fixture.componentInstance.formVersion.set(2);
    await fixture.whenStable();
    http.expectOne(`${url}?formId=feedback&formVersion=2`).flush([second]);
    await fixture.whenStable();
    const { list } = panes(fixture);
    expect(
      list.componentInstance.submissions().map((entry: Submission) => entry.id),
    ).toEqual([second.id]);
    expect(
      fixture.debugElement.injector.get(FormsStore).submissionsEntities(),
    ).toHaveLength(2);
    fixture.componentInstance.formId.set(undefined);
    await fixture.whenStable();
    http.expectOne(`${url}?formVersion=2`).flush([second]);
    fixture.componentInstance.formVersion.set(undefined);
    await fixture.whenStable();
    http.expectOne(url).flush([]);
    await fixture.whenStable();
    expect(list.nativeElement.textContent).toContain('No submissions found.');
    expect(list.componentInstance.submissions()).toEqual([]);
  });

  it('supports a requested detail ID and clearing the selection without a detail request', async () => {
    const fixture = TestBed.createComponent(SubmissionsPage);
    fixture.componentInstance.submissionId.set(first.id);
    await fixture.whenStable();
    http.expectOne(url).flush([]);
    http.expectOne(`${url}/${first.id}`).flush(first);
    await fixture.whenStable();
    expect(panes(fixture).detail.nativeElement.textContent).toContain(
      'First message',
    );
    fixture.componentInstance.submissionId.set(null);
    await fixture.whenStable();
    expect(panes(fixture).detail.componentInstance.submission()).toBeNull();
    http.expectNone((request) => request.url.startsWith(`${url}/`));
  });

  it('shows read failures and retries list and detail requests', async () => {
    const fixture = TestBed.createComponent(SubmissionsPage);
    await fixture.whenStable();
    http.expectOne(url).flush({}, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
    click(fixture, 'Retry submissions');
    http.expectOne(url).flush([first]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    click(fixture, 'View details');
    http
      .expectOne(`${url}/${first.id}`)
      .flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]'),
    ).not.toBeNull();
    click(fixture, 'Retry details');
    http.expectOne(`${url}/${first.id}`).flush(first);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(panes(fixture).detail.nativeElement.textContent).toContain(
      'First message',
    );
    click(fixture, 'Refresh submissions');
    http.expectOne(url).flush([first, second]);
    await fixture.whenStable();
    expect(panes(fixture).list.componentInstance.submissions()).toHaveLength(2);
  });

  it('cancels superseded list requests and keeps independent host scopes isolated', async () => {
    const firstHost = TestBed.createComponent(SubmissionsPage);
    await firstHost.whenStable();
    const stale = http.expectOne(url);
    firstHost.componentInstance.formId.set('feedback');
    await firstHost.whenStable();
    expect(stale.cancelled).toBe(true);
    http.expectOne(`${url}?formId=feedback`).flush([second]);
    const secondHost = TestBed.createComponent(SubmissionsPage);
    await secondHost.whenStable();
    http.expectOne(url).flush([]);
    await firstHost.whenStable();
    await secondHost.whenStable();
    expect(firstHost.debugElement.injector.get(FormsStore)).not.toBe(
      secondHost.debugElement.injector.get(FormsStore),
    );
    expect(panes(firstHost).list.componentInstance.submissions()).toHaveLength(
      1,
    );
    expect(panes(secondHost).list.componentInstance.submissions()).toEqual([]);
  });
});
