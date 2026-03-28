import { jwtDecode } from 'jwt-decode';

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

export type LoginTokens = {
  accessToken: string;
  refreshToken: string;
};

export function getStoredToken(key: string): string | undefined {
  try {
    if (typeof localStorage === 'undefined') {
      return undefined;
    }

    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function storeTokens(tokens: LoginTokens): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  } catch {
    // noop: storage can be unavailable in non-browser environments
  }
}

export function clearStoredTokens(): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // noop: storage can be unavailable in non-browser environments
  }
}

export function resolveUserIdFromAccessToken(
  accessToken: string | undefined
): string | undefined {
  if (!accessToken) {
    return undefined;
  }

  try {
    const decoded = jwtDecode<{ sub?: string }>(accessToken);
    return decoded.sub;
  } catch {
    return undefined;
  }
}
