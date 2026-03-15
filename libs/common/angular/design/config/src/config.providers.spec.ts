import { TestBed } from '@angular/core/testing';
import {
  DESIGN_SYSTEM_COLUMNS,
  DESIGN_SYSTEM_CONFIG,
  DESIGN_SYSTEM_DENSITY,
  DESIGN_SYSTEM_LAYOUT,
  DESIGN_SYSTEM_SURFACE,
  DESIGN_SYSTEM_THEME,
} from './config.tokens';
import {
  provideDesignSystemConfig,
  provideDesignSystemDefaults,
} from './config.providers';

describe('design-system providers', () => {
  it('should provide defaults when no overrides are passed', () => {
    TestBed.configureTestingModule({
      providers: [...provideDesignSystemDefaults()],
    });

    expect(TestBed.inject(DESIGN_SYSTEM_THEME)).toBe('default');
    expect(TestBed.inject(DESIGN_SYSTEM_DENSITY)).toBe('comfortable');
    expect(TestBed.inject(DESIGN_SYSTEM_SURFACE)).toBe('plain');
    expect(TestBed.inject(DESIGN_SYSTEM_LAYOUT)).toBe('list');
    expect(TestBed.inject(DESIGN_SYSTEM_COLUMNS)).toBe(1);
  });

  it('should allow explicit override precedence over defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideDesignSystemConfig({
          theme: 'enterprise',
          density: 'compact',
          surface: 'card',
          layout: 'grid',
          columns: 3,
        }),
      ],
    });

    expect(TestBed.inject(DESIGN_SYSTEM_THEME)).toBe('enterprise');
    expect(TestBed.inject(DESIGN_SYSTEM_DENSITY)).toBe('compact');
    expect(TestBed.inject(DESIGN_SYSTEM_SURFACE)).toBe('card');
    expect(TestBed.inject(DESIGN_SYSTEM_LAYOUT)).toBe('grid');
    expect(TestBed.inject(DESIGN_SYSTEM_COLUMNS)).toBe(3);

    const mergedConfig = TestBed.inject(DESIGN_SYSTEM_CONFIG);
    expect(mergedConfig.theme).toBe('enterprise');
  });
});
