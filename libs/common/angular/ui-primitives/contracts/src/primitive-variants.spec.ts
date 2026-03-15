import {
  PRIMITIVE_APPEARANCES,
  PRIMITIVE_CARD_APPEARANCES,
  PRIMITIVE_DATA_ATTRIBUTES,
  PRIMITIVE_DENSITIES,
  PRIMITIVE_SIZES,
  PRIMITIVE_TONES,
  isPrimitiveAppearance,
  isPrimitiveCardAppearance,
  isPrimitiveDensity,
  isPrimitiveSize,
  isPrimitiveTone,
} from './primitive-variants';

describe('primitive-variants', () => {
  it('should expose stable contracts', () => {
    expect(PRIMITIVE_TONES).toEqual([
      'neutral',
      'primary',
      'success',
      'danger',
    ]);
    expect(PRIMITIVE_APPEARANCES).toEqual(['solid', 'outline', 'ghost']);
    expect(PRIMITIVE_SIZES).toEqual(['sm', 'md', 'lg']);
    expect(PRIMITIVE_DENSITIES).toEqual(['compact', 'comfortable']);
    expect(PRIMITIVE_CARD_APPEARANCES).toEqual([
      'plain',
      'outlined',
      'elevated',
    ]);

    expect(PRIMITIVE_DATA_ATTRIBUTES.tone).toBe('data-tone');
    expect(PRIMITIVE_DATA_ATTRIBUTES.appearance).toBe('data-appearance');
  });

  it('should validate values', () => {
    expect(isPrimitiveTone('success')).toBe(true);
    expect(isPrimitiveTone('warning')).toBe(false);

    expect(isPrimitiveAppearance('ghost')).toBe(true);
    expect(isPrimitiveAppearance('filled')).toBe(false);

    expect(isPrimitiveSize('md')).toBe(true);
    expect(isPrimitiveSize('xl')).toBe(false);

    expect(isPrimitiveDensity('compact')).toBe(true);
    expect(isPrimitiveDensity('spacious')).toBe(false);

    expect(isPrimitiveCardAppearance('elevated')).toBe(true);
    expect(isPrimitiveCardAppearance('raised')).toBe(false);
  });
});
