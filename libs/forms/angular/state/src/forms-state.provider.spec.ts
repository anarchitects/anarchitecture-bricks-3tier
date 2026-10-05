import { FormsApi } from '@anarchitects/forms-angular/data-access';
import {
  ApplicationConfig,
  createEnvironmentInjector,
  EnvironmentInjector,
  Provider,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { provideFormsState } from './forms-state.provider';
import { FormsStore } from './forms.store';

describe('provideFormsState', () => {
  it('returns a composable provider array', () => {
    const providers: Provider[] = provideFormsState();

    expect([...providers]).toEqual([FormsStore]);
  });

  it('registers one store in an application provider scope', () => {
    const config: ApplicationConfig = {
      providers: [...provideFormsState(), { provide: FormsApi, useValue: {} }],
    };
    TestBed.configureTestingModule(config);

    const store = TestBed.inject(FormsStore);

    expect(store.loading()).toBe(false);
    expect(TestBed.inject(FormsStore)).toBe(store);
  });

  it('shares state within a route scope and isolates separate scopes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: FormsApi, useValue: {} }],
    });
    const route: Route = {
      path: 'forms',
      providers: [...provideFormsState()],
    };
    const parent = TestBed.inject(EnvironmentInjector);
    const first = createEnvironmentInjector(route.providers ?? [], parent);
    const second = createEnvironmentInjector(route.providers ?? [], parent);
    const child = createEnvironmentInjector([], first);

    try {
      expect(child.get(FormsStore)).toBe(first.get(FormsStore));
      expect(second.get(FormsStore)).not.toBe(first.get(FormsStore));
      expect(parent.get(FormsStore, null)).toBeNull();
    } finally {
      child.destroy();
      second.destroy();
      first.destroy();
    }
  });

  it('continues to support nested provider arrays', () => {
    TestBed.configureTestingModule({
      providers: [provideFormsState(), { provide: FormsApi, useValue: {} }],
    });

    expect(TestBed.inject(FormsStore)).toBeTruthy();
  });
});
