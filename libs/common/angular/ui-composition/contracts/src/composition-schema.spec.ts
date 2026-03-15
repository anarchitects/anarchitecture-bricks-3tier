import { TestBed } from '@angular/core/testing';
import {
  ANX_COMPOSITION_SCHEMA,
  injectAnxCompositionSchemas,
  provideAnxCompositionSchema,
} from './composition-schema';

describe('composition-schema', () => {
  it('should support multi-provider registration', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAnxCompositionSchema({
          componentKind: 'card',
          supportedSlots: ['header', 'content', 'footer'],
          supportedTemplates: ['content'],
          defaultLayoutRegion: 'content',
        }),
        provideAnxCompositionSchema({
          componentKind: 'list',
          supportedSlots: ['toolbar', 'content', 'empty'],
          supportedTemplates: ['item', 'empty'],
          defaultLayoutRegion: 'item',
        }),
      ],
    });

    const schemas = TestBed.runInInjectionContext(() =>
      injectAnxCompositionSchemas(),
    );

    expect(schemas).toHaveLength(2);
    expect(schemas[0]?.componentKind).toBe('card');
    expect(schemas[1]?.componentKind).toBe('list');
  });

  it('should resolve to empty when no schemas are provided', () => {
    TestBed.configureTestingModule({
      providers: [],
    });

    const directLookup = TestBed.runInInjectionContext(() =>
      TestBed.inject(ANX_COMPOSITION_SCHEMA, null),
    );
    const schemas = TestBed.runInInjectionContext(() =>
      injectAnxCompositionSchemas(),
    );

    expect(directLookup).toBeNull();
    expect(schemas).toEqual([]);
  });
});
