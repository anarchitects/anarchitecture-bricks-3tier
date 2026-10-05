import { randomUUID } from 'node:crypto';
import {
  test as base,
  expect,
  type CDPSession,
  type Page,
} from '@playwright/test';
import { startPasskeyContractHost } from '../../../tools/testing/passkey-contract-host.mjs';

const test = base.extend<
  {
    device: { client: CDPSession; authenticatorId: string };
  },
  { host: Awaited<ReturnType<typeof startPasskeyContractHost>> }
>({
  host: [
    async ({ browserName }, use) => {
      if (browserName !== 'chromium')
        throw new Error(
          'Passkey contracts require Chromium virtual authenticators.',
        );
      const host = await startPasskeyContractHost();
      try {
        await use(host);
      } finally {
        await host.close();
      }
    },
    { scope: 'worker', timeout: 120_000 },
  ],
  baseURL: async ({ host }, use) => use(host.origin),
  device: async ({ page }, use) => {
    const client = await page.context().newCDPSession(page);
    await client.send('WebAuthn.enable');
    const { authenticatorId } = await client.send(
      'WebAuthn.addVirtualAuthenticator',
      {
        options: {
          protocol: 'ctap2',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
          isUserVerified: true,
          automaticPresenceSimulation: true,
        },
      },
    );
    try {
      await use({ client, authenticatorId });
    } finally {
      await client.detach();
    }
  },
});

async function registerAndEnroll(page: Page) {
  const email = `passkey-${randomUUID()}@example.test`;
  const password = 'PasskeyContract123!';
  expect(
    (
      await page.request.post('/api/auth/register', {
        data: {
          email,
          name: 'Passkey user',
          password,
          confirmPassword: password,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post('/api/auth/login', {
        data: { credential: email, password },
      })
    ).status(),
  ).toBe(200);
  await page.goto('/passkeys');
  await expect(page.getByTestId('session')).toContainText(email);
  await page.getByRole('button', { name: 'Add a passkey' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Passkey request completed.',
  );
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByTestId('session')).toHaveText('Signed out');
  await expect(
    page.getByRole('button', { name: 'Sign in with a passkey' }),
  ).toBeEnabled();
  return email;
}

// This helper asserts UI/session completion, rather than treating a browser credential as authentication.
async function signIn(page: Page, email: string) {
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await expect(page.getByTestId('session')).toContainText(email);
  await expect(page.getByRole('status')).toHaveText(
    'Passkey request completed.',
  );
}

test('native browser enrollment and sign-in create a restorable HTTP-only session', async ({
  page,
  device,
}) => {
  const email = await registerAndEnroll(page);
  const { credentials } = await device.client.send('WebAuthn.getCredentials', {
    authenticatorId: device.authenticatorId,
  });
  expect(credentials).toHaveLength(1);
  expect(credentials[0].rpId).toBe('localhost');
  await signIn(page, email);
  expect((await page.request.get('/api/auth/me')).status()).toBe(200);
  const cookies = await page.context().cookies();
  expect(
    cookies.some(
      (cookie) => cookie.name.includes('session_token') && cookie.httpOnly,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull();
  await page.reload();
  await expect(page.getByTestId('session')).toContainText(email);
});

test('cancellation aborts the prompt without verification and permits a fresh attempt', async ({
  page,
  device,
}) => {
  const email = await registerAndEnroll(page);
  await device.client.send('WebAuthn.setAutomaticPresenceSimulation', {
    authenticatorId: device.authenticatorId,
    enabled: false,
  });
  const finishes: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/authentication/finish'))
      finishes.push(request.url());
  });
  const begin = page.waitForResponse('**/authentication/begin');
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await begin;
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('cancelled');
  await expect(page.getByTestId('session')).toHaveText('Signed out');
  expect(finishes).toHaveLength(0);
  await device.client.send('WebAuthn.setAutomaticPresenceSimulation', {
    authenticatorId: device.authenticatorId,
    enabled: true,
  });
  await signIn(page, email);
  expect(finishes).toHaveLength(1);
});

test('leaving the feature destroys its active ceremony and the next scope can sign in', async ({
  page,
  device,
}) => {
  const email = await registerAndEnroll(page);
  await device.client.send('WebAuthn.setAutomaticPresenceSimulation', {
    authenticatorId: device.authenticatorId,
    enabled: false,
  });
  const begin = page.waitForResponse('**/authentication/begin');
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  await begin;
  await page.getByRole('link', { name: 'Use password sign-in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'Passkeys', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Cancel', exact: true }),
  ).toHaveCount(0);
  await device.client.send('WebAuthn.setAutomaticPresenceSimulation', {
    authenticatorId: device.authenticatorId,
    enabled: true,
  });
  await signIn(page, email);
});

test('invalid signatures fail without a session and the reactive command supports retry', async ({
  page,
  device,
}) => {
  const email = await registerAndEnroll(page);
  await device.client.send('WebAuthn.setResponseOverrideBits', {
    authenticatorId: device.authenticatorId,
    isBogusSignature: true,
  });
  const finish = page.waitForResponse('**/authentication/finish');
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  const response = await finish;
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('session')).toHaveText('Signed out');
  expect(
    (await page.context().cookies()).some((cookie) =>
      cookie.name.includes('session_token'),
    ),
  ).toBe(false);
  await device.client.send('WebAuthn.setResponseOverrideBits', {
    authenticatorId: device.authenticatorId,
  });
  await signIn(page, email);
});

test('a consumed assertion cannot be replayed and does not issue another session cookie', async ({
  page,
  device,
}) => {
  // The fixture enables the authenticator before enrolling.
  expect(device.authenticatorId).toBeTruthy();
  const email = await registerAndEnroll(page);
  const finishRequest = page.waitForRequest('**/authentication/finish');
  await signIn(page, email);
  const replay = await page.request.post(
    '/api/auth/passkeys/authentication/finish',
    { data: (await finishRequest).postDataJSON() },
  );
  expect(replay.status()).toBeGreaterThanOrEqual(400);
  expect(replay.status()).toBeLessThan(500);
  expect(replay.headers()['set-cookie']).toBeUndefined();
});

test('missing challenge cookies reject a browser assertion without authenticating', async ({
  page,
  device,
}) => {
  expect(device.authenticatorId).toBeTruthy();
  await registerAndEnroll(page);
  await page.route('**/authentication/finish', async (route) => {
    await page.context().clearCookies();
    await route.continue();
  });
  const finish = page.waitForResponse('**/authentication/finish');
  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  const response = await finish;
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('session')).toHaveText('Signed out');
});

test('public HTTP contracts reject anonymous enrollment and malformed credentials', async ({
  request,
}) => {
  expect(
    (
      await request.post('/api/auth/passkeys/registration/begin', { data: {} })
    ).status(),
  ).toBe(401);
  for (const ceremony of ['registration', 'authentication']) {
    const result = await request.post(`/api/auth/passkeys/${ceremony}/finish`, {
      data: { response: { id: 'invalid' } },
    });
    expect(result.status()).toBe(400);
    expect(result.headers()['set-cookie']).toBeUndefined();
  }
});

test('unsupported JSON APIs offer password fallback without starting a challenge', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(PublicKeyCredential, 'parseRequestOptionsFromJSON', {
      value: undefined,
    }),
  );
  const challenges: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/passkeys/')) challenges.push(request.url());
  });
  await page.goto('/passkeys');
  await expect(page.getByRole('status')).toContainText('not supported');
  await expect(
    page.getByRole('button', { name: 'Sign in with a passkey' }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Use password sign-in' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(challenges).toHaveLength(0);
});
