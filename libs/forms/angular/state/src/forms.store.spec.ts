import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { delay, of } from 'rxjs';
import { FormsStore } from './forms.store';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsApi } from '@anarchitects/forms-angular/data-access';

const mockFormConfig: FormConfig = {
  id: 'contact',
  version: 1,
  fields: [
    {
      name: 'name',
      ui: { label: 'Name' },
      kind: 'string',
      required: true,
    },
  ],
};

const setup = () => {
  const mockFormsApi = {
    getDefinition: jest.fn(() =>
      of({ config: mockFormConfig, schema: {} }).pipe(delay(100))
    ),
    submitForm: jest.fn(() => of({ success: true }).pipe(delay(100))),
  };

  TestBed.configureTestingModule({
    providers: [{ provide: FormsApi, useValue: mockFormsApi }],
  });

  return TestBed.inject(FormsStore);
};

describe('Forms', () => {
  it('should create an instance', () => {
    expect(setup()).toBeTruthy();
  });
  describe('getFormDefition', () => {
    it('should load form definition and update state', fakeAsync(() => {
      const store = setup();
      store.getFormDefinition({ id: 'contact', version: 1 });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      tick(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.selectedId()).toBe('contact');
      expect(store.formConfigsEntities().length).toBe(1);
      expect(store.formConfigsEntities()[0]).toEqual(mockFormConfig);
    }));
  });

  describe('submitForm', () => {
    it('should submit form and update state', fakeAsync(() => {
      const store = setup();
      const submissionDto = {
        formId: 'contact',
        formVersion: 1,
        payload: { name: 'John Doe' },
      };
      store.submitForm(submissionDto);
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      tick(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.submitted()).toBe(true);
    }));
  });
});
