import {
  ANX_DEFAULT_DETAIL_LAYOUT_IDS,
  ANX_DEFAULT_FORM_LAYOUT_IDS,
  ANX_DEFAULT_LAYOUT_DEFAULTS,
  ANX_DEFAULT_LAYOUT_DEFINITIONS,
  ANX_DEFAULT_LIST_LAYOUT_IDS,
} from './layout-definitions';

describe('layout-definitions', () => {
  it('should expose all built-in default layout ids', () => {
    expect(ANX_DEFAULT_FORM_LAYOUT_IDS).toEqual({
      stacked: 'form:stacked',
      grid: 'form:grid',
      inline: 'form:inline',
      card: 'form:card',
    });

    expect(ANX_DEFAULT_LIST_LAYOUT_IDS).toEqual({
      list: 'list:list',
      grid: 'list:grid',
      card: 'list:card',
      table: 'list:table',
    });

    expect(ANX_DEFAULT_DETAIL_LAYOUT_IDS).toEqual({
      page: 'detail:page',
      card: 'detail:card',
      sidebar: 'detail:sidebar',
    });
  });

  it('should expose default definitions and resolver defaults', () => {
    expect(ANX_DEFAULT_LAYOUT_DEFINITIONS).toHaveLength(11);
    expect(ANX_DEFAULT_LAYOUT_DEFAULTS.form).toBe('form:stacked');
    expect(ANX_DEFAULT_LAYOUT_DEFAULTS.list).toBe('list:list');
    expect(ANX_DEFAULT_LAYOUT_DEFAULTS.detail).toBe('detail:page');
  });
});
