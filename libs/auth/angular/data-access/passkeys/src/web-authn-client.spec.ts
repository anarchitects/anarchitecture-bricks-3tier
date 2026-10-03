import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { WebAuthnClient } from './web-authn-client';

const creationOptions = {
  rp: { name: 'Example' },
  user: { id: 'dXNlcg', name: 'user', displayName: 'User' },
  challenge: 'Y2hhbGxlbmdl',
  pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }],
};
const assertion = { type: 'public-key', response: { signature: 'c2ln' } };
const attestation = {
  type: 'public-key',
  response: { attestationObject: 'YXR0' },
};

function setup(platform = 'browser') {
  const credentials = { create: vi.fn(), get: vi.fn() };
  const publicKey = {
    parseCreationOptionsFromJSON: vi.fn(() => ({
      challenge: new Uint8Array([1]),
    })),
    parseRequestOptionsFromJSON: vi.fn(() => ({
      challenge: new Uint8Array([2]),
    })),
    prototype: {
      toJSON() {
        return {};
      },
    },
  };
  const win = {
    isSecureContext: true,
    PublicKeyCredential: publicKey,
    navigator: { credentials },
  };
  TestBed.configureTestingModule({
    providers: [
      WebAuthnClient,
      { provide: DOCUMENT, useValue: { defaultView: win } },
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return {
    client: TestBed.inject(WebAuthnClient),
    credentials,
    publicKey,
    win,
  };
}

describe('WebAuthnClient', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('uses native JSON decoding and credential serialization for registration', async () => {
    const { client, credentials, publicKey } = setup();
    const toJSON = vi.fn(() => attestation);
    credentials.create.mockResolvedValue({ type: 'public-key', toJSON });
    expect(await firstValueFrom(client.create(creationOptions))).toEqual(
      attestation,
    );
    expect(publicKey.parseCreationOptionsFromJSON).toHaveBeenCalledWith(
      creationOptions,
    );
    expect(credentials.create).toHaveBeenCalledWith({
      publicKey: { challenge: new Uint8Array([1]) },
      signal: expect.any(AbortSignal),
    });
    expect(toJSON).toHaveBeenCalledOnce();
  });

  it('uses native JSON decoding and serialization for authentication', async () => {
    const { client, credentials, publicKey } = setup();
    credentials.get.mockResolvedValue({
      type: 'public-key',
      toJSON: () => assertion,
    });
    expect(
      await firstValueFrom(client.get({ challenge: 'Y2hhbGxlbmdl' })),
    ).toEqual(assertion);
    expect(publicKey.parseRequestOptionsFromJSON).toHaveBeenCalledWith({
      challenge: 'Y2hhbGxlbmdl',
    });
    expect(credentials.get).toHaveBeenCalledWith({
      publicKey: { challenge: new Uint8Array([2]) },
      signal: expect.any(AbortSignal),
    });
  });

  it.each(['server', 'insecure', 'legacy'])(
    'fails gracefully on %s environments without prompting',
    async (environment) => {
      const { client, credentials, win } = setup(
        environment === 'server' ? 'server' : 'browser',
      );
      if (environment === 'insecure') win.isSecureContext = false;
      if (environment === 'legacy')
        Object.assign(win.PublicKeyCredential, {
          parseRequestOptionsFromJSON: undefined,
        });
      expect(client.isSupported()).toBe(false);
      await expect(
        firstValueFrom(client.get({ challenge: 'YQ' })),
      ).rejects.toMatchObject({ kind: 'unsupported' });
      expect(credentials.get).not.toHaveBeenCalled();
    },
  );

  it('aborts on unsubscribe and ignores a late browser response', async () => {
    const { client, credentials } = setup();
    let resolve!: (value: unknown) => void;
    credentials.get.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const next = vi.fn();
    const subscription = client.get({ challenge: 'YQ' }).subscribe(next);
    const signal = credentials.get.mock.calls[0][0].signal as AbortSignal;
    expect(signal.aborted).toBe(false);
    subscription.unsubscribe();
    expect(signal.aborted).toBe(true);
    const toJSON = vi.fn(() => assertion);
    resolve({ type: 'public-key', toJSON });
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    expect(toJSON).not.toHaveBeenCalled();
  });

  it.each(['AbortError', 'NotAllowedError'])(
    'treats %s as cancellation or timeout',
    async (name) => {
      const { client, credentials } = setup();
      credentials.get.mockRejectedValue(new DOMException('Cancelled', name));
      await expect(
        firstValueFrom(client.get({ challenge: 'YQ' })),
      ).rejects.toMatchObject({ kind: 'cancelled' });
    },
  );

  it('rejects a credential from the wrong ceremony', async () => {
    const { client, credentials } = setup();
    credentials.get.mockResolvedValue({
      type: 'public-key',
      toJSON: () => attestation,
    });
    await expect(
      firstValueFrom(client.get({ challenge: 'YQ' })),
    ).rejects.toMatchObject({ kind: 'failed' });
  });
});
