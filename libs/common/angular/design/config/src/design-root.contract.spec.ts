import { ANX_DATA_ATTRIBUTES } from '@anarchitects/common-angular-design/contracts';
import {
  ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES,
  ANX_DESIGN_ROOT_MANAGED_KEYS,
  pickAnxDesignRootContext,
  resolveAnxDesignRootContext,
  resolveAnxDesignRootValue,
} from './design-root.contract';

describe('design root contract', () => {
  it('should manage only theme, density, and surface in v1', () => {
    expect(ANX_DESIGN_ROOT_MANAGED_KEYS).toEqual([
      'theme',
      'density',
      'surface',
    ]);
    expect(ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES).toEqual({
      theme: ANX_DATA_ATTRIBUTES.theme,
      density: ANX_DATA_ATTRIBUTES.density,
      surface: ANX_DATA_ATTRIBUTES.surface,
    });
    expect(Object.values(ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES)).not.toContain(
      ANX_DATA_ATTRIBUTES.layout,
    );
    expect(Object.values(ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES)).not.toContain(
      ANX_DATA_ATTRIBUTES.columns,
    );
  });

  it('should resolve precedence as input over attribute over config', () => {
    expect(
      resolveAnxDesignRootValue({
        inputValue: 'input-theme',
        attributeValue: 'attribute-theme',
        configValue: 'config-theme',
      }),
    ).toEqual({
      source: 'input',
      value: 'input-theme',
    });

    expect(
      resolveAnxDesignRootValue({
        inputValue: null,
        attributeValue: 'attribute-theme',
        configValue: 'config-theme',
      }),
    ).toEqual({
      source: 'attribute',
      value: 'attribute-theme',
    });

    expect(
      resolveAnxDesignRootValue({
        inputValue: null,
        attributeValue: null,
        configValue: 'config-theme',
      }),
    ).toEqual({
      source: 'config',
      value: 'config-theme',
    });
  });

  it('should resolve the managed root context by the fixed precedence rules', () => {
    const config = pickAnxDesignRootContext({
      theme: 'default',
      density: 'comfortable',
      surface: 'plain',
      layout: 'grid',
      columns: 3,
    });

    expect(
      resolveAnxDesignRootContext({
        config,
        inputs: {
          theme: 'input-theme',
        },
        attributes: {
          density: 'compact',
          surface: 'card',
        },
      }),
    ).toEqual({
      context: {
        theme: 'input-theme',
        density: 'compact',
        surface: 'card',
      },
      sources: {
        theme: 'input',
        density: 'attribute',
        surface: 'attribute',
      },
    });
  });
});
