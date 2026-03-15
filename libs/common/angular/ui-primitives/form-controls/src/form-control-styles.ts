export const ANX_FORM_CONTROL_STYLES = `input[anarchitectsUiInput],
textarea[anarchitectsUiTextarea],
select[anarchitectsUiSelect] {
  --anx-cmp-control-padding-block: var(--anx-sys-space-sm);
  --anx-cmp-control-padding-inline: var(--anx-sys-space-xs);
  --anx-cmp-control-radius: var(--anx-sys-radius-sm);
  --anx-cmp-control-border: var(--anx-sys-color-border);
  --anx-cmp-control-bg: var(--anx-sys-color-surface);
  --anx-cmp-control-fg: var(--anx-sys-color-text);

  width: 100%;
  border: 1px solid var(--anx-cmp-control-border);
  border-radius: var(--anx-cmp-control-radius);
  background: var(--anx-cmp-control-bg);
  color: var(--anx-cmp-control-fg);
  padding-block: var(--anx-cmp-control-padding-block);
  padding-inline: var(--anx-cmp-control-padding-inline);
}

input[anarchitectsUiInput][data-size='sm'],
textarea[anarchitectsUiTextarea][data-size='sm'],
select[anarchitectsUiSelect][data-size='sm'] {
  --anx-cmp-control-padding-block: var(--anx-sys-space-xs);
  font-size: 0.8125rem;
}

input[anarchitectsUiInput][data-size='lg'],
textarea[anarchitectsUiTextarea][data-size='lg'],
select[anarchitectsUiSelect][data-size='lg'] {
  --anx-cmp-control-padding-block: var(--anx-sys-space-md);
  font-size: 1rem;
}

input[anarchitectsUiInput][data-density='compact'],
textarea[anarchitectsUiTextarea][data-density='compact'],
select[anarchitectsUiSelect][data-density='compact'] {
  --anx-cmp-control-padding-block: var(--anx-sys-space-xs);
}

input[anarchitectsUiInput][data-invalid='true'],
textarea[anarchitectsUiTextarea][data-invalid='true'],
select[anarchitectsUiSelect][data-invalid='true'] {
  --anx-cmp-control-border: var(--anx-sys-color-danger);
}
`;

export const ANX_FORM_CONTROL_STYLES_ELEMENT_ID =
  'anx-common-angular-ui-form-controls';

export function applyAnxFormControlStyles(
  documentRef?: Document,
): HTMLStyleElement | null {
  const doc =
    documentRef ?? (typeof document !== 'undefined' ? document : null);
  if (!doc) {
    return null;
  }

  const existing = doc.getElementById(ANX_FORM_CONTROL_STYLES_ELEMENT_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const styleElement = doc.createElement('style');
  styleElement.id = ANX_FORM_CONTROL_STYLES_ELEMENT_ID;
  styleElement.textContent = ANX_FORM_CONTROL_STYLES;
  doc.head.appendChild(styleElement);
  return styleElement;
}
