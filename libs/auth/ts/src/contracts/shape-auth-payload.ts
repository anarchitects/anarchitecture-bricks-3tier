import type { AuthFieldMeta } from './auth-contracts.factory';

export type AuthPayloadFieldBehavior = Pick<
  AuthFieldMeta,
  'required' | 'emptyStringPolicy'
>;

export type AuthPayloadFieldBehaviorMap = Record<
  string,
  AuthPayloadFieldBehavior
>;

export function shapeAuthPayload<
  TPayload extends Record<string, unknown>,
  TFieldMap extends AuthPayloadFieldBehaviorMap,
>(payload: TPayload, fieldMap: TFieldMap): TPayload {
  const shapedEntries = Object.entries(payload).flatMap(([key, value]) => {
    const fieldBehavior = fieldMap[key];
    const isEmptyOptionalValue = value === '' || value === null;

    if (
      !fieldBehavior ||
      fieldBehavior.required ||
      !isEmptyOptionalValue
    ) {
      return [[key, value] as const];
    }

    switch (fieldBehavior.emptyStringPolicy) {
      case 'allow':
        return [[key, '' as unknown] as const];
      case 'strip':
        return [];
      case 'reject':
        throw new Error(
          `Empty string is not allowed for optional field "${key}".`,
        );
    }
  });

  return Object.fromEntries(shapedEntries) as TPayload;
}
