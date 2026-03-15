import {
  ANX_BASE_STYLES_ELEMENT_ID,
  ANX_STYLE_CONVENTIONS,
  applyAnxBaseStyles,
  createAnxBaseStylesElement,
} from './style-contract';

describe('style-contract', () => {
  it('should expose stable style conventions', () => {
    expect(ANX_STYLE_CONVENTIONS).toEqual({
      rootClass: 'anx-root',
      semanticClassPrefix: 'anx-',
      dataAttributePrefix: 'data-anx-',
    });
  });

  it('should create style element with base styles', () => {
    const styleElement = createAnxBaseStylesElement(document);
    expect(styleElement).toBeTruthy();
    expect(styleElement?.id).toBe(ANX_BASE_STYLES_ELEMENT_ID);
    expect(styleElement?.textContent).toContain('.anx-root');
  });

  it('should apply base styles only once', () => {
    const first = applyAnxBaseStyles(document);
    const second = applyAnxBaseStyles(document);
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first).toBe(second);
  });
});
