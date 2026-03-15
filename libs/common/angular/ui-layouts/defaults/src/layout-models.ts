export type AnxFormLayoutField = {
  key?: string;
  name?: string;
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  [key: string]: unknown;
};

export type AnxFormLayoutModel = {
  title?: string;
  fields: readonly AnxFormLayoutField[];
  submitLabel?: string;
  columns?: number;
  [key: string]: unknown;
};

export type AnxListLayoutModel = {
  title?: string;
  items: readonly unknown[];
  columns?: number;
  [key: string]: unknown;
};

export type AnxDetailLayoutModel = {
  title?: string;
  data?: unknown;
  [key: string]: unknown;
};

export function toAnxFormLayoutModel(model: unknown): AnxFormLayoutModel {
  if (!model || typeof model !== 'object') {
    return { fields: [] };
  }

  const record = model as Record<string, unknown>;
  const fields = Array.isArray(record['fields'])
    ? (record['fields'] as AnxFormLayoutField[])
    : [];

  return {
    ...record,
    fields,
  } as AnxFormLayoutModel;
}

export function toAnxListLayoutModel(model: unknown): AnxListLayoutModel {
  if (!model || typeof model !== 'object') {
    return { items: [] };
  }

  const record = model as Record<string, unknown>;
  const items = Array.isArray(record['items'])
    ? (record['items'] as unknown[])
    : [];

  return {
    ...record,
    items,
  } as AnxListLayoutModel;
}

export function toAnxDetailLayoutModel(model: unknown): AnxDetailLayoutModel {
  if (!model || typeof model !== 'object') {
    return {};
  }

  return model as AnxDetailLayoutModel;
}
