import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  provideAuthConfig,
  SUPPRESS_AUTH_FAILURE_REDIRECT,
} from '@anarchitects/auth-angular/config';
import { firstValueFrom, Observable } from 'rxjs';
import { PasskeyApi } from './passkey-api';

const response = {
  id: 'YQ',
  rawId: 'YQ',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: 'YQ', authenticatorData: 'YQ', signature: 'YQ' },
};

describe('PasskeyApi', () => {
  let api: PasskeyApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PasskeyApi,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        ...provideAuthConfig({ apiResourcePath: 'accounts' }),
      ],
    });
    api = TestBed.inject(PasskeyApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('uses configured resource paths and cookies throughout both ceremonies', () => {
    const registration = {
      ...response,
      response: { clientDataJSON: 'YQ', attestationObject: 'YQ' },
    };
    const calls = [
      {
        request: api.beginRegistration({}),
        path: 'registration/begin',
        body: {},
        result: {},
      },
      {
        request: api.finishRegistration({
          response: registration,
          name: 'Laptop',
        }),
        path: 'registration/finish',
        body: { response: registration, name: 'Laptop' },
        result: { success: true },
      },
      {
        request: api.beginAuthentication(),
        path: 'authentication/begin',
        body: {},
        result: {},
      },
      {
        request: api.finishAuthentication({ response }),
        path: 'authentication/finish',
        body: { response },
        result: { user: { id: 'u', email: 'u@example.com' }, rbac: [] },
      },
    ];
    for (const call of calls) {
      (call.request as Observable<unknown>).subscribe();
      const req = http.expectOne(`/api/accounts/passkeys/${call.path}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(call.body);
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.context.get(SUPPRESS_AUTH_FAILURE_REDIRECT)).toBe(
        true,
      );
      req.flush(call.result);
    }
  });

  it.each([
    { user: null, rbac: [] },
    { user: { id: '', email: 'u@example.com' }, rbac: [] },
    {
      user: { id: 'u', email: 'u@example.com' },
      rbac: [{ action: 'read', subject: '' }],
    },
  ])('rejects malformed verified sessions', async (body) => {
    const result = firstValueFrom(api.finishAuthentication({ response }));
    http.expectOne('/api/accounts/passkeys/authentication/finish').flush(body);
    await expect(result).rejects.toThrow();
  });

  it('does not report enrollment success on a failed server response', async () => {
    const result = firstValueFrom(
      api.finishRegistration({
        response: {
          ...response,
          response: { clientDataJSON: 'YQ', attestationObject: 'YQ' },
        },
      }),
    );
    http
      .expectOne('/api/accounts/passkeys/registration/finish')
      .flush({ success: false });
    await expect(result).rejects.toThrow(
      'Passkey registration was not completed.',
    );
  });
});
