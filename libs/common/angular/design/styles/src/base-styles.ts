export const ANX_BASE_STYLES = `.anx-root,
.anx-root[data-anx-theme='default'] {
  --anx-ref-color-neutral-0: #ffffff;
  --anx-ref-color-neutral-50: #f6f7f8;
  --anx-ref-color-neutral-100: #eceff2;
  --anx-ref-color-neutral-700: #30353d;
  --anx-ref-color-neutral-900: #161a20;
  --anx-ref-color-brand-500: #0f6fc6;
  --anx-ref-color-brand-700: #08569c;
  --anx-ref-color-success-500: #1f8f56;
  --anx-ref-color-success-50: #ebf8f1;
  --anx-ref-color-danger-500: #c23b3b;
  --anx-ref-color-danger-50: #fceeee;
  --anx-ref-shadow-soft: 0 10px 30px rgba(22, 26, 32, 0.08);

  --anx-sys-color-surface: var(--anx-ref-color-neutral-0);
  --anx-sys-color-surface-muted: var(--anx-ref-color-neutral-50);
  --anx-sys-color-text: var(--anx-ref-color-neutral-900);
  --anx-sys-color-text-muted: var(--anx-ref-color-neutral-700);
  --anx-sys-color-border: var(--anx-ref-color-neutral-100);
  --anx-sys-color-accent: var(--anx-ref-color-brand-500);
  --anx-sys-color-accent-contrast: var(--anx-ref-color-neutral-0);
  --anx-sys-color-success: var(--anx-ref-color-success-500);
  --anx-sys-color-success-contrast: var(--anx-ref-color-neutral-0);
  --anx-sys-color-success-surface: var(--anx-ref-color-success-50);
  --anx-sys-color-danger: var(--anx-ref-color-danger-500);
  --anx-sys-color-danger-contrast: var(--anx-ref-color-neutral-0);
  --anx-sys-color-danger-surface: var(--anx-ref-color-danger-50);
  --anx-sys-radius-sm: 0.25rem;
  --anx-sys-radius-md: 0.5rem;
  --anx-sys-radius-lg: 0.75rem;
  --anx-sys-space-xs: 0.25rem;
  --anx-sys-space-sm: 0.5rem;
  --anx-sys-space-md: 0.75rem;
  --anx-sys-space-lg: 1rem;
  --anx-sys-font-family-base: 'Source Sans 3', 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  --anx-sys-font-size-body: 0.9375rem;
  --anx-sys-font-size-heading: 1.25rem;
  --anx-sys-line-height-body: 1.45;
  --anx-sys-focus-ring: 2px solid var(--anx-sys-color-accent);
  --anx-sys-shadow-surface: var(--anx-ref-shadow-soft);

  --anx-layout-container-max-inline-size: 75rem;
  --anx-layout-gap-inline: 0.75rem;
  --anx-layout-gap-stack: 1rem;
  --anx-layout-grid-min-column-size: 16rem;
  --anx-layout-columns: 1;
  --anx-layout-block-padding-compact: 0.5rem;
  --anx-layout-block-padding-comfortable: 0.875rem;

  --anx-layout-block-padding-current: var(--anx-layout-block-padding-comfortable);
}

.anx-root[data-anx-density='compact'] {
  --anx-layout-block-padding-current: var(--anx-layout-block-padding-compact);
}

.anx-root[data-anx-density='comfortable'] {
  --anx-layout-block-padding-current: var(
    --anx-layout-block-padding-comfortable
  );
}

.anx-root {
  box-sizing: border-box;
  color: var(--anx-sys-color-text);
  background: var(--anx-sys-color-surface);
  font-family: var(--anx-sys-font-family-base);
  font-size: var(--anx-sys-font-size-body);
  line-height: var(--anx-sys-line-height-body);
  max-inline-size: var(--anx-layout-container-max-inline-size);
}

.anx-root *,
.anx-root *::before,
.anx-root *::after {
  box-sizing: inherit;
}

.anx-root :where(h1, h2, h3, h4, h5, h6, p, ul, ol) {
  margin: 0;
}

.anx-root :where(input, button, textarea, select) {
  font: inherit;
  color: inherit;
}

.anx-root :where(a, button, input, select, textarea):focus-visible {
  outline: var(--anx-sys-focus-ring);
  outline-offset: 2px;
}

.anx-root .anx-region {
  padding-block: var(--anx-layout-block-padding-current);
  padding-inline: var(--anx-sys-space-lg);
}

.anx-root .anx-surface {
  border-radius: var(--anx-sys-radius-md);
  border: 1px solid var(--anx-sys-color-border);
  background: var(--anx-sys-color-surface);
}

.anx-root[data-anx-surface='plain'] .anx-surface {
  border-color: transparent;
  box-shadow: none;
}

.anx-root[data-anx-surface='card'] .anx-surface {
  background: var(--anx-sys-color-surface-muted);
  box-shadow: var(--anx-sys-shadow-surface);
}

.anx-root .anx-stack {
  display: grid;
  gap: var(--anx-layout-gap-stack);
}

.anx-root .anx-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--anx-layout-gap-inline);
}

.anx-root .anx-grid {
  display: grid;
  gap: var(--anx-layout-gap-stack);
  grid-template-columns: repeat(var(--anx-layout-columns), minmax(0, 1fr));
}

.anx-root[data-anx-layout='list'] .anx-grid {
  grid-template-columns: 1fr;
}

.anx-root[data-anx-layout='grid'] .anx-grid {
  grid-template-columns: repeat(
    var(--anx-layout-columns),
    minmax(min(var(--anx-layout-grid-min-column-size), 100%), 1fr)
  );
}

.anx-root[data-anx-columns='1'] {
  --anx-layout-columns: 1;
}

.anx-root[data-anx-columns='2'] {
  --anx-layout-columns: 2;
}

.anx-root[data-anx-columns='3'] {
  --anx-layout-columns: 3;
}

.anx-root[data-anx-columns='4'] {
  --anx-layout-columns: 4;
}

.anx-root .anx-heading {
  font-size: var(--anx-sys-font-size-heading);
  color: var(--anx-sys-color-text);
}

.anx-root .anx-text {
  color: var(--anx-sys-color-text-muted);
}

.anx-root .anx-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--anx-sys-space-sm) var(--anx-sys-space-md);
  border-radius: var(--anx-sys-radius-sm);
  border: 1px solid transparent;
  background: var(--anx-sys-color-accent);
  color: var(--anx-sys-color-accent-contrast);
}
`;
