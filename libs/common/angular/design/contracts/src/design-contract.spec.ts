import {
  ANX_DATA_ATTRIBUTES,
  ANX_DENSITIES,
  ANX_LAYOUTS,
  ANX_ROOT_CLASS,
  ANX_SEMANTIC_CLASSNAMES,
  ANX_SURFACES,
  isAnxDensity,
  isAnxLayout,
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
});
