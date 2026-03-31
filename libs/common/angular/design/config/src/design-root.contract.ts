import {
  ANX_DATA_ATTRIBUTES,
  ANX_ROOT_CLASS,
} from '@anarchitects/common-angular-design/contracts';
import { DesignSystemConfig } from './config.tokens';

export const ANX_DESIGN_ROOT_MANAGED_KEYS = [
  'theme',
  'density',
  'surface',
] as const;

export type AnxDesignRootManagedKey =
  (typeof ANX_DESIGN_ROOT_MANAGED_KEYS)[number];

export type AnxDesignRootContext = Pick<
  DesignSystemConfig,
  AnxDesignRootManagedKey
>;

export const ANX_DESIGN_ROOT_HOST_CLASS = ANX_ROOT_CLASS;

export const ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES = {
  theme: ANX_DATA_ATTRIBUTES.theme,
  density: ANX_DATA_ATTRIBUTES.density,
  surface: ANX_DATA_ATTRIBUTES.surface,
} as const satisfies Record<AnxDesignRootManagedKey, string>;

export type AnxDesignRootValueSource = 'input' | 'attribute' | 'config';

export type AnxDesignRootResolvedValue<T extends string = string> = {
  source: AnxDesignRootValueSource;
  value: T;
};

export type AnxDesignRootResolution = {
  context: Record<AnxDesignRootManagedKey, string>;
  sources: Record<AnxDesignRootManagedKey, AnxDesignRootValueSource>;
};

type AnxDesignRootValueOverrides = Partial<
  Record<AnxDesignRootManagedKey, string | null | undefined>
>;

export function pickAnxDesignRootContext(
  config: DesignSystemConfig,
): AnxDesignRootContext {
  return {
    theme: config.theme,
    density: config.density,
    surface: config.surface,
  };
}

export function resolveAnxDesignRootValue<T extends string>(options: {
  inputValue?: T | null;
  attributeValue?: T | null;
  configValue: T;
}): AnxDesignRootResolvedValue<T> {
  if (hasExplicitValue(options.inputValue)) {
    return {
      source: 'input',
      value: options.inputValue,
    };
  }

  if (hasExplicitValue(options.attributeValue)) {
    return {
      source: 'attribute',
      value: options.attributeValue,
    };
  }

  return {
    source: 'config',
    value: options.configValue,
  };
}

export function resolveAnxDesignRootContext(options: {
  config: AnxDesignRootContext;
  inputs?: AnxDesignRootValueOverrides;
  attributes?: AnxDesignRootValueOverrides;
}): AnxDesignRootResolution {
  const context = {} as Record<AnxDesignRootManagedKey, string>;
  const sources = {} as Record<
    AnxDesignRootManagedKey,
    AnxDesignRootValueSource
  >;

  for (const key of ANX_DESIGN_ROOT_MANAGED_KEYS) {
    const resolved = resolveAnxDesignRootValue({
      inputValue: options.inputs?.[key] ?? null,
      attributeValue: options.attributes?.[key] ?? null,
      configValue: options.config[key],
    });

    context[key] = resolved.value;
    sources[key] = resolved.source;
  }

  return { context, sources };
}

function hasExplicitValue<T extends string>(
  value: T | null | undefined,
): value is T {
  return value != null && value !== '';
}
