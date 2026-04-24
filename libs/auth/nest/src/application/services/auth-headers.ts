export type AuthRequestHeaders =
  | HeadersInit
  | Record<string, string | string[] | undefined>;

export const toAuthHeaders = (
  input?: AuthRequestHeaders,
): Headers | undefined => {
  if (!input) {
    return undefined;
  }

  if (typeof Headers !== 'undefined' && input instanceof Headers) {
    return input;
  }

  const headers = new Headers();

  if (Array.isArray(input)) {
    input.forEach(([key, value]) => headers.append(key, value));
    return headers;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      return;
    }

    headers.set(key, value);
  });

  return headers;
};
