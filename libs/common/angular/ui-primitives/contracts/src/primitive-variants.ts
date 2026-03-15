export const PRIMITIVE_TONES = [
  'neutral',
  'primary',
  'success',
  'danger',
] as const;
export type PrimitiveTone = (typeof PRIMITIVE_TONES)[number];

export const PRIMITIVE_APPEARANCES = ['solid', 'outline', 'ghost'] as const;
export type PrimitiveAppearance = (typeof PRIMITIVE_APPEARANCES)[number];

export const PRIMITIVE_SIZES = ['sm', 'md', 'lg'] as const;
export type PrimitiveSize = (typeof PRIMITIVE_SIZES)[number];

export const PRIMITIVE_DENSITIES = ['compact', 'comfortable'] as const;
export type PrimitiveDensity = (typeof PRIMITIVE_DENSITIES)[number];

export const PRIMITIVE_CARD_APPEARANCES = [
  'plain',
  'outlined',
  'elevated',
] as const;
export type PrimitiveCardAppearance =
  (typeof PRIMITIVE_CARD_APPEARANCES)[number];

export const PRIMITIVE_DATA_ATTRIBUTES = {
  tone: 'data-tone',
  appearance: 'data-appearance',
  size: 'data-size',
  density: 'data-density',
  invalid: 'data-invalid',
  loading: 'data-loading',
  disabled: 'data-disabled',
} as const;

export function isPrimitiveTone(value: string): value is PrimitiveTone {
  return (PRIMITIVE_TONES as readonly string[]).includes(value);
}

export function isPrimitiveAppearance(
  value: string,
): value is PrimitiveAppearance {
  return (PRIMITIVE_APPEARANCES as readonly string[]).includes(value);
}

export function isPrimitiveSize(value: string): value is PrimitiveSize {
  return (PRIMITIVE_SIZES as readonly string[]).includes(value);
}

export function isPrimitiveDensity(value: string): value is PrimitiveDensity {
  return (PRIMITIVE_DENSITIES as readonly string[]).includes(value);
}

export function isPrimitiveCardAppearance(
  value: string,
): value is PrimitiveCardAppearance {
  return (PRIMITIVE_CARD_APPEARANCES as readonly string[]).includes(value);
}
