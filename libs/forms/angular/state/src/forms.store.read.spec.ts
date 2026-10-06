import { FormsApi } from '@anarchitects/forms-angular/data-access';
import {
  SubmissionResponseDTO,
  SubmissionsQueryDTO,
  SubmissionsResponseDTO,
} from '@anarchitects/forms-ts/dtos';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { FormsStore, provideFormsState } from './index';

const submission = (
  id: string,
  formId = 'contact',
  formVersion = 1,
): SubmissionResponseDTO => ({
  id,
  formId,
  formVersion,
  payload: { message: id },
  createdAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T11:00:00.000Z',
});

function setup() {
  const list = new Subject<SubmissionsResponseDTO>();
  const detail = new Subject<SubmissionResponseDTO>();
  const write = new Subject<SubmissionResponseDTO>();
  const api = {
    getSubmissions: vi.fn<FormsApi['getSubmissions']>().mockReturnValue(list),
    getSubmission: vi.fn<FormsApi['getSubmission']>().mockReturnValue(detail),
    submitForm: vi.fn<FormsApi['submitForm']>().mockReturnValue(write),
    getDefinition: vi.fn<FormsApi['getDefinition']>().mockReturnValue(
      of({
        config: { id: 'contact', version: 1, fields: [] },
        schema: {},
      }),
    ),
  };
  TestBed.configureTestingModule({
    providers: [...provideFormsState(), { provide: FormsApi, useValue: api }],
  });
  return { store: TestBed.inject(FormsStore), api, list, detail, write };
}

describe('FormsStore submission reads', () => {
  it('starts without selection, read errors, pending requests, or automatic reads', () => {
    const { store, api } = setup();
    expect(store.selectedSubmissionId()).toBeNull();
    expect(store.selectedSubmission()).toBeNull();
    expect(store.loadedSubmissions()).toEqual([]);
    expect(store.submissionsLoading()).toBe(false);
    expect(store.submissionLoading()).toBe(false);
    expect(store.submissionsError()).toBeNull();
    expect(store.submissionError()).toBeNull();
    expect(api.getSubmissions).not.toHaveBeenCalled();
    expect(api.getSubmission).not.toHaveBeenCalled();
  });

  it.each<SubmissionsQueryDTO | undefined>([
    undefined,
    { formId: 'contact' },
    { formVersion: 2 },
    { formId: 'contact', formVersion: 2 },
  ])(
    'loads a collection with filters %j and converts response dates',
    (filters) => {
      const { store, api, list } = setup();
      store.loadSubmissions(filters);
      expect(api.getSubmissions).toHaveBeenCalledWith(filters ?? {});
      expect(store.submissionsLoading()).toBe(true);
      expect(store.submissionsError()).toBeNull();
      list.next([submission('first', 'contact', 2)]);
      list.complete();
      expect(store.submissionsLoading()).toBe(false);
      expect(store.loadedSubmissions()).toEqual([
        {
          ...submission('first', 'contact', 2),
          createdAt: new Date('2026-10-06T10:00:00.000Z'),
          updatedAt: new Date('2026-10-06T11:00:00.000Z'),
        },
      ]);
      expect(store.submissionsEntities()).toEqual(store.loadedSubmissions());
      expect(store.selectedSubmission()).toBeNull();
    },
  );

  it('replaces list membership while retaining cached and submitted entities', () => {
    const { store, api, list, write } = setup();
    store.submitForm({ formId: 'contact', formVersion: 1, payload: {} });
    write.next(submission('created'));
    write.complete();
    store.loadSubmissions();
    list.next([submission('first'), submission('second')]);
    list.complete();
    store.selectSubmission('first');
    api.getSubmissions.mockReturnValueOnce(
      of([submission('second', 'feedback', 2)]),
    );
    store.loadSubmissions({ formId: 'feedback', formVersion: 2 });
    expect(store.loadedSubmissions().map((item) => item.id)).toEqual([
      'second',
    ]);
    expect(store.submissionsEntities().map((item) => item.id)).toEqual([
      'created',
      'first',
      'second',
    ]);
    expect(store.submissionsEntityMap()['second'].formVersion).toBe(2);
    expect(store.selectedSubmission()?.id).toBe('first');
    expect(store.submitted()).toBe(true);
    api.getSubmissions.mockReturnValueOnce(of([]));
    store.loadSubmissions({ formId: 'missing' });
    expect(store.loadedSubmissions()).toEqual([]);
    expect(store.submissionsEntities()).toHaveLength(3);
  });

  it('selects cached list entries without HTTP and supports clearing or unknown selection', () => {
    const { store, api, list } = setup();
    store.loadSubmissions();
    list.next([submission('first')]);
    list.complete();
    store.selectSubmission('first');
    expect(store.selectedSubmission()?.id).toBe('first');
    store.selectSubmission('unknown');
    expect(store.selectedSubmissionId()).toBe('unknown');
    expect(store.selectedSubmission()).toBeNull();
    store.selectSubmission(null);
    expect(store.selectedSubmissionId()).toBeNull();
    expect(store.selectedSubmission()).toBeNull();
    expect(api.getSubmission).not.toHaveBeenCalled();
  });

  it('loads and selects a detail, updating the canonical entity and list selector', () => {
    const { store, api, list, detail } = setup();
    store.loadSubmissions();
    list.next([submission('first'), submission('second')]);
    list.complete();
    store.loadSubmission('first');
    expect(api.getSubmission).toHaveBeenCalledWith('first');
    expect(store.selectedSubmissionId()).toBe('first');
    expect(store.submissionLoading()).toBe(true);
    expect(store.submissionError()).toBeNull();
    detail.next({ ...submission('first'), payload: { message: 'updated' } });
    detail.complete();
    expect(store.submissionLoading()).toBe(false);
    expect(store.selectedSubmission()?.payload).toEqual({ message: 'updated' });
    expect(store.selectedSubmission()?.createdAt).toBeInstanceOf(Date);
    expect(store.selectedSubmission()?.updatedAt).toBeInstanceOf(Date);
    expect(store.loadedSubmissions()[0]).toBe(store.selectedSubmission());
    expect(store.submissionsEntities()).toHaveLength(2);
  });

  it('adds an uncached detail without changing the latest list membership', () => {
    const { store, detail } = setup();
    store.loadSubmission('remote');
    expect(store.selectedSubmission()).toBeNull();
    detail.next(submission('remote'));
    detail.complete();
    expect(store.selectedSubmission()?.id).toBe('remote');
    expect(store.submissionsEntities()).toHaveLength(1);
    expect(store.loadedSubmissions()).toEqual([]);
  });

  it.each([
    { error: new Error('Unavailable'), message: 'Unavailable' },
    { error: 'Access denied', message: 'Access denied' },
    { error: null, message: 'Unable to load submissions' },
  ])(
    'reports list errors and recovers on retry: $message',
    ({ error, message }) => {
      const { store, api } = setup();
      api.getSubmissions.mockReturnValueOnce(of([submission('cached')]));
      store.loadSubmissions();
      api.getSubmissions.mockReturnValueOnce(throwError(() => error));
      store.loadSubmissions();
      expect(store.submissionsLoading()).toBe(false);
      expect(store.submissionsError()).toBe(message);
      expect(store.loadedSubmissions()[0].id).toBe('cached');
      const retry = new Subject<SubmissionsResponseDTO>();
      api.getSubmissions.mockReturnValueOnce(retry);
      store.loadSubmissions();
      expect(store.submissionsLoading()).toBe(true);
      expect(store.submissionsError()).toBeNull();
      retry.next([]);
      retry.complete();
      expect(store.submissionsLoading()).toBe(false);
      expect(store.loadedSubmissions()).toEqual([]);
    },
  );

  it('reports detail errors without selecting an unrelated entity and recovers on retry', () => {
    const { store, api, detail } = setup();
    store.loadSubmission('missing');
    detail.error(new Error('Not found'));
    expect(store.submissionLoading()).toBe(false);
    expect(store.submissionError()).toBe('Not found');
    expect(store.selectedSubmissionId()).toBe('missing');
    expect(store.selectedSubmission()).toBeNull();
    api.getSubmission.mockReturnValueOnce(of(submission('found')));
    store.loadSubmission('found');
    expect(store.submissionError()).toBeNull();
    expect(store.selectedSubmission()?.id).toBe('found');
  });

  it('keeps list, detail, and write status independent during concurrent operations', () => {
    const { store, list, detail, write } = setup();
    store.getFormDefinition({ id: 'contact', version: 1 });
    store.submitForm({ formId: 'contact', formVersion: 1, payload: {} });
    store.loadSubmissions();
    store.loadSubmission('detail');
    list.error(new Error('List failed'));
    expect(store.submissionsLoading()).toBe(false);
    expect(store.submissionsError()).toBe('List failed');
    expect(store.submissionLoading()).toBe(true);
    expect(store.submissionError()).toBeNull();
    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();
    detail.next(submission('detail'));
    detail.complete();
    expect(store.loading()).toBe(true);
    write.next(submission('created'));
    write.complete();
    expect(store.loading()).toBe(false);
    expect(store.submitted()).toBe(true);
    expect(store.selectedSubmission()?.id).toBe('detail');
    expect(store.selectedFormConfig()?.id).toBe('contact');
    expect(store.selectedVersion()).toBe(1);
    expect(store.schemas()).toEqual([{}]);
    expect(store.submissionsEntities().map((item) => item.id)).toEqual([
      'detail',
      'created',
    ]);
  });

  it('cancels superseded list reads without clearing the new loading state', () => {
    const { store, api, list } = setup();
    const latest = new Subject<SubmissionsResponseDTO>();
    store.loadSubmissions({ formId: 'old' });
    api.getSubmissions.mockReturnValueOnce(latest);
    store.loadSubmissions({ formId: 'new' });
    list.next([submission('old')]);
    list.complete();
    expect(store.submissionsLoading()).toBe(true);
    expect(store.loadedSubmissions()).toEqual([]);
    latest.next([submission('new')]);
    latest.complete();
    expect(store.submissionsLoading()).toBe(false);
    expect(store.loadedSubmissions().map((item) => item.id)).toEqual(['new']);
    expect(store.submissionsEntityMap()['old']).toBeUndefined();
  });

  it('cancels superseded detail reads and lets explicit selection win over pending requests', () => {
    const { store, api, detail } = setup();
    const latest = new Subject<SubmissionResponseDTO>();
    store.loadSubmission('old');
    api.getSubmission.mockReturnValueOnce(latest);
    store.loadSubmission('new');
    detail.next(submission('old'));
    detail.complete();
    expect(store.submissionLoading()).toBe(true);
    expect(store.selectedSubmissionId()).toBe('new');
    expect(store.submissionsEntities()).toEqual([]);
    store.selectSubmission(null);
    latest.next(submission('new'));
    latest.complete();
    expect(store.submissionLoading()).toBe(false);
    expect(store.selectedSubmissionId()).toBeNull();
    expect(store.submissionsEntities()).toEqual([]);
  });

  it('turns invalid response dates into a recoverable read error', () => {
    const { store, api } = setup();
    api.getSubmissions.mockReturnValueOnce(
      of([{ ...submission('bad'), createdAt: 'invalid' }]),
    );
    store.loadSubmissions();
    expect(store.submissionsError()).toBeTruthy();
    expect(store.submissionsLoading()).toBe(false);
    expect(store.submissionsEntities()).toEqual([]);
    api.getSubmissions.mockReturnValueOnce(of([submission('good')]));
    store.loadSubmissions();
    expect(store.submissionsError()).toBeNull();
    expect(store.loadedSubmissions()[0].id).toBe('good');
  });
});
