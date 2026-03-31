import { TestBed } from '@angular/core/testing';
import {
  FORMS_PAGE_PRESET,
  FORMS_PAGE_PRESET_DEFAULTS,
  injectFormsPagePreset,
  normalizeFormsPagePreset,
} from './page-preset';

describe('Forms page preset', () => {
  it('should normalize with defaults and keep positive columns', () => {
    expect(
      normalizeFormsPagePreset({
        layoutVariant: 'grid',
        columns: 3,
      }),
    ).toEqual({
      ...FORMS_PAGE_PRESET_DEFAULTS,
      layoutVariant: 'grid',
      columns: 3,
    });
  });

  it('should coerce invalid columns to 1 when present', () => {
    expect(
      normalizeFormsPagePreset({
        columns: 0,
      }),
    ).toEqual({
      ...FORMS_PAGE_PRESET_DEFAULTS,
      columns: 1,
    });
  });

  it('should inject defaults when no provider is registered', () => {
    TestBed.runInInjectionContext(() => {
      expect(injectFormsPagePreset()).toEqual(FORMS_PAGE_PRESET_DEFAULTS);
    });
  });

  it('should inject provided preset when token is configured', () => {
    const preset = normalizeFormsPagePreset({
      layoutVariant: 'inline',
      actionAlignment: 'center',
    });

    TestBed.configureTestingModule({
      providers: [{ provide: FORMS_PAGE_PRESET, useValue: preset }],
    });

    TestBed.runInInjectionContext(() => {
      expect(injectFormsPagePreset()).toEqual(preset);
    });
  });
});
