import { ANX_BASE_STYLES } from './base-styles';

export const ANX_BASE_STYLES_ELEMENT_ID =
  'anx-common-angular-design-base-styles';

export const ANX_STYLE_CONVENTIONS = {
  rootClass: 'anx-root',
  semanticClassPrefix: 'anx-',
  dataAttributePrefix: 'data-anx-',
} as const;

/**
 * CSS class rules for package authors.
 *
 * Defines which semantic classes are forbidden on component host elements
 * and the recommended alternative for component-internal spacing.
 */
export const ANX_PACKAGE_AUTHOR_RULES = {
  forbiddenOnComponentHost: [
    'anx-region',
    'anx-stack',
    'anx-inline',
    'anx-grid',
  ] as const,
  recommendation:
    'Use `:host { padding: ...; gap: ...; }` CSS for component-internal spacing instead of applying shell utility classes to the component host.',
} as const;

function resolveDocument(documentRef?: Document): Document | null {
  if (documentRef) {
    return documentRef;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return document;
}

export function createAnxBaseStylesElement(
  documentRef?: Document,
): HTMLStyleElement | null {
  const doc = resolveDocument(documentRef);
  if (!doc) {
    return null;
  }

  const styleElement = doc.createElement('style');
  styleElement.id = ANX_BASE_STYLES_ELEMENT_ID;
  styleElement.textContent = ANX_BASE_STYLES;
  return styleElement;
}

export function applyAnxBaseStyles(
  documentRef?: Document,
): HTMLStyleElement | null {
  const doc = resolveDocument(documentRef);
  if (!doc) {
    return null;
  }

  const existing = doc.getElementById(ANX_BASE_STYLES_ELEMENT_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const styleElement = createAnxBaseStylesElement(doc);
  if (!styleElement) {
    return null;
  }

  doc.head.appendChild(styleElement);
  return styleElement;
}
