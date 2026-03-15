import {
  ANX_COMPONENT_TOKEN_PREFIX,
  ANX_DEFAULT_LAYOUT_TOKEN_VALUES,
  ANX_DEFAULT_REF_TOKEN_VALUES,
  ANX_DEFAULT_SYS_TOKEN_VALUES,
  ANX_DEFAULT_TOKEN_VALUES,
  ANX_TOKEN_NAMES,
  ANX_TOKEN_PREFIX,
} from './token-contract';

describe('token-contract', () => {
  it('should expose expected prefixes', () => {
    expect(ANX_TOKEN_PREFIX).toBe('--anx-');
    expect(ANX_COMPONENT_TOKEN_PREFIX).toBe('--anx-cmp-');
  });

  it('should keep every token name under the anx namespace', () => {
    const allNames = [
      ...Object.values(ANX_TOKEN_NAMES.ref),
      ...Object.values(ANX_TOKEN_NAMES.sys),
      ...Object.values(ANX_TOKEN_NAMES.layout),
    ];

    expect(allNames.every((name) => name.startsWith(ANX_TOKEN_PREFIX))).toBe(
      true,
    );
  });

  it('should provide defaults for all token categories', () => {
    expect(Object.keys(ANX_DEFAULT_REF_TOKEN_VALUES).length).toBe(
      Object.keys(ANX_TOKEN_NAMES.ref).length,
    );
    expect(Object.keys(ANX_DEFAULT_SYS_TOKEN_VALUES).length).toBe(
      Object.keys(ANX_TOKEN_NAMES.sys).length,
    );
    expect(Object.keys(ANX_DEFAULT_LAYOUT_TOKEN_VALUES).length).toBe(
      Object.keys(ANX_TOKEN_NAMES.layout).length,
    );

    const mergedCount =
      Object.keys(ANX_DEFAULT_REF_TOKEN_VALUES).length +
      Object.keys(ANX_DEFAULT_SYS_TOKEN_VALUES).length +
      Object.keys(ANX_DEFAULT_LAYOUT_TOKEN_VALUES).length;

    expect(Object.keys(ANX_DEFAULT_TOKEN_VALUES).length).toBe(mergedCount);
  });
});
