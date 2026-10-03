import { AUTH_PUBLIC_METADATA_KEY } from '@anarchitects/auth-declarations';
import { UnauthorizedException } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AuthPasskeyService } from '../../application/services/auth-passkey.service';
import { PasskeyAuthController } from './passkey-auth.controller';

const assertion = {
  id: 'YQ',
  rawId: 'YQ',
  type: 'public-key',
  clientExtensionResults: {},
  response: { clientDataJSON: 'YQ', authenticatorData: 'YQ', signature: 'YQ' },
};
const attestation = {
  ...assertion,
  response: { clientDataJSON: 'YQ', attestationObject: 'YQ' },
};
const creation = {
  rp: { name: 'Example' },
  user: { id: 'dXNlcg', name: 'user', displayName: 'User' },
  challenge: 'YQ',
  pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
};

describe('PasskeyAuthController HTTP contracts', () => {
  let app: NestFastifyApplication;
  const service = {
    beginRegistration: jest.fn(),
    finishRegistration: jest.fn(),
    beginAuthentication: jest.fn(),
    finishAuthentication: jest.fn(),
  };
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PasskeyAuthController],
      providers: [{ provide: AuthPasskeyService, useValue: service }],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    app.useLogger(false);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterEach(async () => {
    await app.close();
    jest.resetAllMocks();
  });

  it.each([
    {
      path: 'registration/begin',
      method: 'beginRegistration' as const,
      dto: {},
      body: creation,
    },
    {
      path: 'registration/finish',
      method: 'finishRegistration' as const,
      dto: { response: attestation, name: 'Laptop' },
      body: { success: true },
    },
    {
      path: 'authentication/begin',
      method: 'beginAuthentication' as const,
      dto: {},
      body: { challenge: 'YQ' },
    },
    {
      path: 'authentication/finish',
      method: 'finishAuthentication' as const,
      dto: { response: assertion },
      body: { user: { id: 'u', email: 'u@example.com' }, rbac: [] },
    },
  ])(
    'forwards DTOs and cookies for $path',
    async ({ path, method, dto, body }) => {
      const headers = new Headers();
      headers.append('set-cookie', 'challenge=abc; Path=/; HttpOnly');
      headers.append('set-cookie', 'session=def; Path=/; HttpOnly');
      service[method].mockResolvedValue({ body, headers });
      const result = await app.inject({
        method: 'POST',
        url: `/auth/passkeys/${path}`,
        payload: dto,
        headers: { cookie: 'incoming=value', origin: 'https://example.com' },
      });
      expect(result.statusCode).toBe(200);
      expect(result.json()).toEqual(body);
      expect(result.headers['set-cookie']).toEqual(headers.getSetCookie());
      const [received, incoming] = service[method].mock.calls[0];
      expect(received).toEqual(dto);
      expect(incoming.get('cookie')).toBe('incoming=value');
      expect(incoming.get('origin')).toBe('https://example.com');
    },
  );

  it.each(['registration', 'authentication'])(
    'rejects malformed %s credentials before the verifier',
    async (ceremony) => {
      const result = await app.inject({
        method: 'POST',
        url: `/auth/passkeys/${ceremony}/finish`,
        payload: { response: { id: 'bad' } },
      });
      expect(result.statusCode).toBe(400);
      expect(service.finishRegistration).not.toHaveBeenCalled();
      expect(service.finishAuthentication).not.toHaveBeenCalled();
    },
  );

  it('preserves unauthorized errors without setting cookies', async () => {
    service.beginRegistration.mockRejectedValue(new UnauthorizedException());
    const result = await app.inject({
      method: 'POST',
      url: '/auth/passkeys/registration/begin',
      payload: {},
    });
    expect(result.statusCode).toBe(401);
    expect(result.headers['set-cookie']).toBeUndefined();
  });

  it('marks sign-in public while leaving enrollment protected by host guards', () => {
    for (const method of [
      'beginAuthentication',
      'finishAuthentication',
    ] as const)
      expect(
        Reflect.getMetadata(
          AUTH_PUBLIC_METADATA_KEY,
          PasskeyAuthController.prototype[method],
        ),
      ).toBe(true);
    for (const method of ['beginRegistration', 'finishRegistration'] as const)
      expect(
        Reflect.getMetadata(
          AUTH_PUBLIC_METADATA_KEY,
          PasskeyAuthController.prototype[method],
        ),
      ).toBeUndefined();
  });
});
