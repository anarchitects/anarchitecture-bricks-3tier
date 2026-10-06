import { FormsApi } from '@anarchitects/forms-angular/data-access';
import {
  SubmissionRequestDTO,
  SubmissionsQueryDTO,
} from '@anarchitects/forms-ts/dtos';
import { fromSubmissionResponseDTO } from '@anarchitects/forms-ts/mappers';
import { FormConfig, Submission } from '@anarchitects/forms-ts/models';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { setEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, map, pipe, switchMap, tap } from 'rxjs';

type FormState = {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedVersion: number | null;
  submitted: boolean;
  schemas: unknown[];
  submissionsLoading: boolean;
  submissionsError: string | null;
  submissionLoading: boolean;
  submissionError: string | null;
  selectedSubmissionId: string | null;
  loadedSubmissionIds: string[];
};

const initialState: FormState = {
  loading: false,
  error: null,
  selectedId: null,
  selectedVersion: null,
  submitted: false,
  schemas: [],
  submissionsLoading: false,
  submissionsError: null,
  submissionLoading: false,
  submissionError: null,
  selectedSubmissionId: null,
  loadedSubmissionIds: [],
};

const readErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unable to load submissions';

const selectFormConfigId = (config: FormConfig) =>
  `${config.id}:${config.version}`;

export const FormsStore = signalStore(
  withState<FormState>(initialState),
  withEntities({ entity: type<Submission>(), collection: 'submissions' }),
  withEntities({ entity: type<FormConfig>(), collection: 'formConfigs' }),
  withProps(() => ({
    _formsApi: inject(FormsApi),
  })),
  withComputed((store) => ({
    selectedSubmission: computed(() => {
      const id = store.selectedSubmissionId();
      return id === null ? null : (store.submissionsEntityMap()[id] ?? null);
    }),
    loadedSubmissions: computed(() =>
      store
        .loadedSubmissionIds()
        .map((id) => store.submissionsEntityMap()[id])
        .filter(
          (submission): submission is Submission => submission !== undefined,
        ),
    ),
    selectedFormConfig: computed(() => {
      const selectedId = store.selectedId();
      const selectedVersion = store.selectedVersion();

      if (selectedId === null || selectedVersion === null) {
        return undefined;
      }

      return store['formConfigsEntities']().find(
        (formConfig) =>
          formConfig.id === selectedId &&
          formConfig.version === selectedVersion,
      );
    }),
  })),
  withMethods((store) => {
    const loadSubmission = rxMethod<string | null>(
      pipe(
        switchMap((id) => {
          patchState(store, {
            selectedSubmissionId: id,
            submissionLoading: id !== null,
            submissionError: null,
          });
          if (id === null) {
            return EMPTY;
          }
          return store._formsApi.getSubmission(id).pipe(
            map(fromSubmissionResponseDTO),
            tapResponse({
              next: (submission) =>
                patchState(
                  store,
                  setEntity(submission, { collection: 'submissions' }),
                ),
              error: (error: unknown) =>
                patchState(store, { submissionError: readErrorMessage(error) }),
              finalize: () => patchState(store, { submissionLoading: false }),
            }),
          );
        }),
      ),
    );

    return {
      loadSubmission,
      selectSubmission(id: string | null): void {
        // Cancel any pending detail request before selecting an entity already in the cache.
        loadSubmission(null);
        patchState(store, { selectedSubmissionId: id });
      },
      loadSubmissions: rxMethod<SubmissionsQueryDTO | void>(
        pipe(
          switchMap((filters) => {
            patchState(store, {
              submissionsLoading: true,
              submissionsError: null,
            });
            return store._formsApi.getSubmissions(filters ?? {}).pipe(
              map((submissions) => submissions.map(fromSubmissionResponseDTO)),
              tapResponse({
                next: (submissions) =>
                  patchState(
                    store,
                    setEntities(submissions, { collection: 'submissions' }),
                    {
                      loadedSubmissionIds: submissions.map(
                        (submission) => submission.id,
                      ),
                    },
                  ),
                error: (error: unknown) =>
                  patchState(store, {
                    submissionsError: readErrorMessage(error),
                  }),
                finalize: () =>
                  patchState(store, { submissionsLoading: false }),
              }),
            );
          }),
        ),
      ),
    };
  }),
  withMethods((store) => ({
    getFormDefinition: rxMethod<{ id: string; version: number }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, version }) =>
          store['_formsApi'].getDefinition(id, version).pipe(
            tapResponse({
              next: ({ config, schema }) =>
                patchState(
                  store,
                  setEntity(config, {
                    collection: 'formConfigs',
                    selectId: selectFormConfigId,
                  }),
                  {
                    loading: false,
                    error: null,
                    selectedId: id,
                    selectedVersion: version,
                    submitted: false,
                    schemas: [...store.schemas(), schema],
                  },
                ),
              error: (error: string) =>
                patchState(store, { loading: false, error: error }),
            }),
          ),
        ),
      ),
    ),
    submitForm: rxMethod<SubmissionRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store['_formsApi'].submitForm(dto).pipe(
            tapResponse({
              next: (submission) =>
                patchState(
                  store,
                  setEntity(fromSubmissionResponseDTO(submission), {
                    collection: 'submissions',
                  }),
                  {
                    loading: false,
                    error: null,
                    submitted: true,
                  },
                ),
              error: (error: string) =>
                patchState(store, { loading: false, error: error }),
            }),
          ),
        ),
      ),
    ),
  })),
);
