import {
  ANX_SLOT_ALIASES,
  KNOWN_ANX_SLOT_NAMES,
  isAnxSlotName,
  normalizeAnxSlotName,
} from './slot-contract';

describe('slot-contract', () => {
  it('should expose canonical slot names and aliases', () => {
    expect(KNOWN_ANX_SLOT_NAMES).toEqual([
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
    ]);
    expect(ANX_SLOT_ALIASES['anxCardHeader']).toBe('header');
    expect(ANX_SLOT_ALIASES['anxCardFooter']).toBe('footer');
  });

  it('should validate and normalize slot names', () => {
    expect(isAnxSlotName('header')).toBe(true);
    expect(isAnxSlotName('app-dashboard-column')).toBe(true);
    expect(isAnxSlotName('dashboard-column')).toBe(false);

    expect(normalizeAnxSlotName('anxCardHeader')).toBe('header');
    expect(normalizeAnxSlotName('app-kanban-lane')).toBe('app-kanban-lane');
    expect(normalizeAnxSlotName('unknown')).toBeNull();
  });
});
