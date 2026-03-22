import { TestBed } from '@angular/core/testing';
import { delay, of } from 'rxjs';
import { FormsStore } from './forms.store';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsApi } from '@anarchitects/forms-angular/data-access';
import { provideFormsState } from './forms-state.provider';

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
    getDefinition: vi.fn((id: string, version?: number) =>
      of({
        config: {
          ...mockFormConfig,
          id,
          version: version ?? 1,
        },
        schema: {},
      }).pipe(delay(100)),
    ),
    submitForm: vi.fn(() =>
      of({
        id: 'submission-1',
        formId: 'contact',
        formVersion: 1,
        payload: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).pipe(delay(100)),
    ),
  };

  TestBed.configureTestingModule({
    providers: [
      provideFormsState(),
      { provide: FormsApi, useValue: mockFormsApi },
    ],
  });

  return TestBed.inject(FormsStore);
};

describe('Forms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should create an instance', () => {
    expect(setup()).toBeTruthy();
  });
  describe('getFormDefinition', () => {
    it('should load form definition and update state', async () => {
      const store = setup();
      store.getFormDefinition({ id: 'contact', version: 1 });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.selectedId()).toBe('contact');
      expect(store.selectedVersion()).toBe(1);
      expect(store.formConfigsEntities().length).toBe(1);
      expect(store.formConfigsEntities()[0]).toEqual({
        ...mockFormConfig,
        id: 'contact',
        version: 1,
      });
      expect(store.selectedFormConfig()).toEqual({
        ...mockFormConfig,
        id: 'contact',
        version: 1,
      });
    });

    it('should keep multiple versions of the same form id', async () => {
      const store = setup();

      store.getFormDefinition({ id: 'contact', version: 1 });
      await vi.advanceTimersByTimeAsync(100);

      store.getFormDefinition({ id: 'contact', version: 2 });
      await vi.advanceTimersByTimeAsync(100);

      expect(store.formConfigsEntities()).toEqual(
        expect.arrayContaining([
          { ...mockFormConfig, id: 'contact', version: 1 },
          { ...mockFormConfig, id: 'contact', version: 2 },
        ]),
      );
      expect(store.formConfigsEntities()).toHaveLength(2);
      expect(store.selectedVersion()).toBe(2);
      expect(store.selectedFormConfig()?.version).toBe(2);
    });
  });

  describe('submitForm', () => {
    it('should submit form and update state', async () => {
      const store = setup();
      const submissionDto = {
        formId: 'contact',
        formVersion: 1,
        payload: { name: 'John Doe' },
      };
      store.submitForm(submissionDto);
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.submitted()).toBe(true);
      expect(store.submissionsEntities().length).toBe(1);
    });
  });
});
