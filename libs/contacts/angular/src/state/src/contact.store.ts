import { ContactsApi } from '@anarchitects/contacts-angular/data-access';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { addEntity, setEntities, withEntities } from '@ngrx/signals/entities';
import { tapResponse } from '@ngrx/operators';
import { mergeMap, of, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { Contact } from '@anarchitects/contacts-ts/models';
import { ContactRequestDto } from '@anarchitects/contacts-ts/dtos';

type ContactState = {
  loading: boolean;
  success: boolean;
  error: string | null;
  selectedId: string | null;
};

const initialState: ContactState = {
  success: false,
  loading: false,
  error: null,
  selectedId: null,
};

export const ContactStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({ _contactsApi: inject(ContactsApi) })),
  withEntities<Contact>(),
  withComputed((state) => ({
    selectedContact: computed(() =>
      state.entities().find((c) => c.id === state.selectedId())
    ),
  })),
  withMethods((store) => ({
    submitForm: rxMethod<ContactRequestDto>(
      pipe(
        tap(() =>
          patchState(store, { loading: true, error: null, success: false })
        ),
        switchMap((contact) =>
          store._contactsApi.createContact(contact).pipe(
            tapResponse({
              next: ({ success }) => patchState(store, { success }),
              error: (error: string) => patchState(store, { error }),
              finalize: () => patchState(store, { loading: false }),
            })
          )
        )
      )
    ),
    loadContacts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          store._contactsApi.getContacts().pipe(
            tapResponse({
              next: (contacts) => patchState(store, setEntities(contacts)),
              error: (error: string) => patchState(store, { error }),
              finalize: () => patchState(store, { loading: false }),
            })
          )
        )
      )
    ),
    selectContact: rxMethod<string>(
      pipe(
        tap(() =>
          patchState(store, { loading: true, error: null, selectedId: null })
        ),
        mergeMap((id) => {
          const contact = store.entities().find((c) => c.id === id);
          if (contact) {
            return of(patchState(store, { selectedId: contact.id }));
          } else {
            return store._contactsApi.getContactById(id).pipe(
              tapResponse({
                next: (contact) => {
                  patchState(store, addEntity(contact), {
                    selectedId: contact.id,
                  });
                },
                error: (error: string) => patchState(store, { error }),
                finalize: () => patchState(store, { loading: false }),
              })
            );
          }
        })
      )
    ),
  }))
);
