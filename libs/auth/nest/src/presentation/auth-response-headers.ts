export const applyResponseHeaders = (
  reply: { header(name: string, value: string | string[]): unknown },
  headers?: Headers,
): void => {
  if (!headers) {
    return;
  }

  const setCookie =
    'getSetCookie' in headers && typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers.get('set-cookie');

  if (Array.isArray(setCookie) && setCookie.length > 0) {
    reply.header('set-cookie', setCookie);
    return;
  }

  if (typeof setCookie === 'string' && setCookie.length > 0) {
    reply.header('set-cookie', setCookie);
  }
};
