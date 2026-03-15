import {
  KNOWN_ANX_TEMPLATE_NAMES,
  isAnxTemplateName,
  normalizeAnxTemplateName,
} from './template-contract';

describe('template-contract', () => {
  it('should expose canonical template names', () => {
    expect(KNOWN_ANX_TEMPLATE_NAMES).toEqual([
      'header',
      'toolbar',
      'content',
      'footer',
      'actions',
      'start',
      'end',
      'label',
      'hint',
      'error',
      'prefix',
      'suffix',
      'empty',
      'item',
      'field',
      'cell',
    ]);
  });

  it('should validate and normalize template names', () => {
    expect(isAnxTemplateName('item')).toBe(true);
    expect(isAnxTemplateName('app-marketing-card')).toBe(true);
    expect(isAnxTemplateName('marketing-card')).toBe(false);

    expect(normalizeAnxTemplateName('field')).toBe('field');
    expect(normalizeAnxTemplateName('app-dashboard-widget')).toBe(
      'app-dashboard-widget',
    );
    expect(normalizeAnxTemplateName('unknown')).toBeNull();
  });
});
