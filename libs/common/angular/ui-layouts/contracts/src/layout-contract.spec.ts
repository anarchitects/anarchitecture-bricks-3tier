import {
  ANX_BUILT_IN_LAYOUT_KINDS,
  ANX_REQUIRED_TEMPLATES_BY_KIND,
  createAnxLayoutId,
  getRequiredTemplatesForKind,
  isAnxLayoutId,
  isAnxLayoutKind,
  parseAnxLayoutId,
} from './layout-contract';

describe('layout-contract', () => {
  it('should expose stable built-in kinds and required templates', () => {
    expect(ANX_BUILT_IN_LAYOUT_KINDS).toEqual(['form', 'list', 'detail']);
    expect(ANX_REQUIRED_TEMPLATES_BY_KIND.form).toEqual(['field']);
    expect(ANX_REQUIRED_TEMPLATES_BY_KIND.list).toEqual(['item']);
    expect(ANX_REQUIRED_TEMPLATES_BY_KIND.detail).toEqual(['content']);
  });

  it('should validate and parse kinds and ids', () => {
    expect(isAnxLayoutKind('form')).toBe(true);
    expect(isAnxLayoutKind('app-dashboard')).toBe(true);
    expect(isAnxLayoutKind('dashboard')).toBe(false);

    expect(isAnxLayoutId('form:grid')).toBe(true);
    expect(isAnxLayoutId('app-kanban:board')).toBe(true);
    expect(isAnxLayoutId('list:')).toBe(false);

    expect(parseAnxLayoutId('detail:sidebar')).toEqual({
      kind: 'detail',
      name: 'sidebar',
    });
    expect(parseAnxLayoutId('invalid')).toBeNull();
  });

  it('should create layout ids and resolve required template sets', () => {
    expect(createAnxLayoutId('list', 'card')).toBe('list:card');
    expect(createAnxLayoutId('app-kanban', 'board')).toBe('app-kanban:board');

    expect(getRequiredTemplatesForKind('form')).toEqual(['field']);
    expect(getRequiredTemplatesForKind('list')).toEqual(['item']);
    expect(getRequiredTemplatesForKind('detail')).toEqual(['content']);
    expect(getRequiredTemplatesForKind('app-dashboard')).toEqual([]);
  });
});
