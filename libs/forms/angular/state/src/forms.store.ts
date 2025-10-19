import { computed, inject } from '@angular/core';
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
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { FormConfig, Submission } from '@anarchitects/forms-ts/models';
import { FormsApi } from '@anarchitects/forms-angular/data-access';
import { pipe, switchMap, tap } from 'rxjs';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';

type FormState = {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  submitted: boolean;
  schemas: unknown[];
};

const initialState: FormState = {
  loading: false,
  error: null,
  selectedId: null,
  submitted: false,
  schemas: [],
};

export const FormsStore = signalStore(
  { providedIn: 'root' },
  withState<FormState>(initialState),
  withEntities({ entity: type<Submission>(), collection: 'submissions' }),
  withEntities({ entity: type<FormConfig>(), collection: 'formConfigs' }),
  withProps(() => ({
    _formsApi: inject(FormsApi),
  })),
  withComputed((store) => ({
    selectedFormConfig: computed(() =>
      store.formConfigsEntities().find((fc) => fc.id === store.selectedId())
    ),
  })),
  withMethods((store) => ({
    getFormDefinition: rxMethod<{ id: string; version: number }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, version }) =>
          store._formsApi.getDefinition(id).pipe(
            tapResponse({
              next: ({ config, schema }) =>
                patchState(
                  store,
                  setEntity(config, { collection: 'formConfigs' }),
                  {
                    loading: false,
                    error: null,
                    selectedId: id,
                    submitted: false,
                    schemas: [...store.schemas(), schema],
                  }
                ),
              error: (error: string) =>
                patchState(store, { loading: false, error: error }),
            })
          )
        )
      )
    ),
    submitForm: rxMethod<SubmissionRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._formsApi.submitForm(dto).pipe(
            tapResponse({
              next: ({ success }) =>
                patchState(store, {
                  loading: false,
                  error: null,
                  submitted: success,
                }),
              error: (error: string) =>
                patchState(store, { loading: false, error: error }),
            })
          )
        )
      )
    ),
  }))
);
