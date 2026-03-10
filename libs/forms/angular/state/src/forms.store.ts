import { FormsApi } from '@anarchitects/forms-angular/data-access';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
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
import { setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

type FormState = {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  selectedVersion: number | null;
  submitted: boolean;
  schemas: unknown[];
};

const initialState: FormState = {
  loading: false,
  error: null,
  selectedId: null,
  selectedVersion: null,
  submitted: false,
  schemas: [],
};

const selectFormConfigId = (config: FormConfig) =>
  `${config.id}:${config.version}`;

export const FormsStore = signalStore(
  { providedIn: 'root' },
  withState<FormState>(initialState),
  withEntities({ entity: type<Submission>(), collection: 'submissions' }),
  withEntities({ entity: type<FormConfig>(), collection: 'formConfigs' }),
  withProps(() => ({
    _formsApi: inject(FormsApi),
  })),
  withComputed((store) => ({
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
