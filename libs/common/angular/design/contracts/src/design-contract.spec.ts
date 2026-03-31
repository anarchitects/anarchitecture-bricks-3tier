import {
  ANX_DATA_ATTRIBUTES,
  ANX_DENSITIES,
  ANX_DESIGN_HOOK_CLASSNAMES,
  ANX_LAYOUTS,
  ANX_ROOT_CLASS,
  ANX_SEMANTIC_CLASSNAMES,
  ANX_SHELL_UTILITY_CLASSNAMES,
  ANX_SURFACES,
  isAnxDensity,
  isAnxLayout,
  isAnxShellUtilityClass,
  isAnxSurface,
} from './design-contract';

describe('design-contract', () => {
  it('should expose stable data-attribute hooks', () => {
    expect(ANX_DATA_ATTRIBUTES).toEqual({
      theme: 'data-anx-theme',
      density: 'data-anx-density',
      surface: 'data-anx-surface',
      layout: 'data-anx-layout',
      columns: 'data-anx-columns',
    });
  });

  it('should expose stable semantic classes', () => {
    expect(ANX_ROOT_CLASS).toBe('anx-root');
    expect(ANX_SEMANTIC_CLASSNAMES.surface).toBe('anx-surface');
    expect(ANX_SEMANTIC_CLASSNAMES.grid).toBe('anx-grid');
  });

  it('should validate enumerated hook values', () => {
    expect(ANX_DENSITIES).toEqual(['compact', 'comfortable']);
    expect(ANX_SURFACES).toEqual(['plain', 'card']);
    expect(ANX_LAYOUTS).toEqual(['list', 'grid']);

    expect(isAnxDensity('compact')).toBe(true);
    expect(isAnxDensity('wide')).toBe(false);

    expect(isAnxSurface('card')).toBe(true);
    expect(isAnxSurface('elevated')).toBe(false);

    expect(isAnxLayout('list')).toBe(true);
    expect(isAnxLayout('masonry')).toBe(false);
  });

  it('should categorize semantic classes into shell utilities and design hooks', () => {
    // Shell utilities: consumer/app-shell layout control
    expect(Object.values(ANX_SHELL_UTILITY_CLASSNAMES)).toEqual([
      'anx-region',
      'anx-stack',
      'anx-inline',
      'anx-grid',
    ]);

    // Design hooks: component-safe styling
    expect(Object.values(ANX_DESIGN_HOOK_CLASSNAMES)).toEqual([
      'anx-surface',
      'anx-heading',
      'anx-text',
      'anx-action',
    ]);

    // Union kept for backward compatibility
    const semanticNames = Object.values(ANX_SEMANTIC_CLASSNAMES).sort();
    const categoryUnion = [
      ...Object.values(ANX_SHELL_UTILITY_CLASSNAMES),
      ...Object.values(ANX_DESIGN_HOOK_CLASSNAMES),
    ].sort();
    expect(semanticNames).toEqual(categoryUnion);
  });

  it('should correctly identify shell utility class names', () => {
    // Shell utilities should be identified
    expect(isAnxShellUtilityClass('anx-region')).toBe(true);
    expect(isAnxShellUtilityClass('anx-stack')).toBe(true);
    expect(isAnxShellUtilityClass('anx-inline')).toBe(true);
    expect(isAnxShellUtilityClass('anx-grid')).toBe(true);

    // Design hooks should not be identified as shell utilities
    expect(isAnxShellUtilityClass('anx-surface')).toBe(false);
    expect(isAnxShellUtilityClass('anx-heading')).toBe(false);
    expect(isAnxShellUtilityClass('anx-text')).toBe(false);
    expect(isAnxShellUtilityClass('anx-action')).toBe(false);

    // Invalid names should be rejected
    expect(isAnxShellUtilityClass('invalid-class')).toBe(false);
    expect(isAnxShellUtilityClass('')).toBe(false);
  });
});
