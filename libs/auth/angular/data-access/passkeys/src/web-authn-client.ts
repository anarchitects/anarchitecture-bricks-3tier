import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import type {
  PasskeyRegistrationBeginResponseDTO,
  PasskeyRegistrationCredentialDTO,
  PasskeyAuthenticationBeginResponseDTO,
  PasskeyAuthenticationCredentialDTO,
} from '@anarchitects/auth-ts/dtos/passkeys';
import { Observable } from 'rxjs';

export class PasskeyBrowserError extends Error {
  constructor(
    readonly kind: 'unsupported' | 'cancelled' | 'failed',
    message: string,
  ) {
    super(message);
  }
}

/** Native WebAuthn JSON conversion. No global browser access during SSR/import. */
@Injectable()
export class WebAuthnClient {
  private readonly document = inject(DOCUMENT);
  private readonly platform = inject(PLATFORM_ID);

  isSupported(): boolean {
    const win = this.document.defaultView;
    return (
      isPlatformBrowser(this.platform) &&
      !!win?.isSecureContext &&
      typeof win.PublicKeyCredential?.parseCreationOptionsFromJSON ===
        'function' &&
      typeof win.PublicKeyCredential?.parseRequestOptionsFromJSON ===
        'function' &&
      typeof win.PublicKeyCredential?.prototype.toJSON === 'function' &&
      typeof win.navigator.credentials?.create === 'function' &&
      typeof win.navigator.credentials?.get === 'function'
    );
  }

  create(
    options: PasskeyRegistrationBeginResponseDTO,
  ): Observable<PasskeyRegistrationCredentialDTO> {
    return this.credential(
      (win, signal) =>
        win.navigator.credentials.create({
          publicKey: win.PublicKeyCredential.parseCreationOptionsFromJSON(
            options as PublicKeyCredentialCreationOptionsJSON,
          ),
          signal,
        }),
      'registration',
    ) as Observable<PasskeyRegistrationCredentialDTO>;
  }

  get(
    options: PasskeyAuthenticationBeginResponseDTO,
  ): Observable<PasskeyAuthenticationCredentialDTO> {
    return this.credential(
      (win, signal) =>
        win.navigator.credentials.get({
          publicKey: win.PublicKeyCredential.parseRequestOptionsFromJSON(
            options as PublicKeyCredentialRequestOptionsJSON,
          ),
          signal,
        }),
      'authentication',
    ) as Observable<PasskeyAuthenticationCredentialDTO>;
  }

  private credential(
    operation: (
      win: Window & typeof globalThis,
      signal: AbortSignal,
    ) => Promise<Credential | null>,
    ceremony: 'registration' | 'authentication',
  ): Observable<
    PasskeyRegistrationCredentialDTO | PasskeyAuthenticationCredentialDTO
  > {
    return new Observable((subscriber) => {
      if (!this.isSupported()) {
        subscriber.error(
          new PasskeyBrowserError(
            'unsupported',
            'Passkeys require a secure browser with WebAuthn JSON support.',
          ),
        );
        return;
      }
      const controller = new AbortController();
      const win = this.document.defaultView as Window & typeof globalThis;
      const fail = (error: unknown) => {
        const name =
          error && typeof error === 'object' && 'name' in error
            ? error.name
            : '';
        subscriber.error(
          error instanceof PasskeyBrowserError
            ? error
            : new PasskeyBrowserError(
                name === 'AbortError' || name === 'NotAllowedError'
                  ? 'cancelled'
                  : 'failed',
                name === 'AbortError' || name === 'NotAllowedError'
                  ? 'Passkey request cancelled or timed out.'
                  : 'The browser could not complete the passkey request.',
              ),
        );
      };
      try {
        operation(win, controller.signal).then((credential) => {
          if (subscriber.closed) return;
          try {
            if (
              !credential ||
              credential.type !== 'public-key' ||
              !('toJSON' in credential) ||
              typeof credential.toJSON !== 'function'
            ) {
              throw new PasskeyBrowserError(
                'failed',
                'The browser did not return a public-key credential.',
              );
            }
            const json = (credential as PublicKeyCredential).toJSON();
            const registration = 'attestationObject' in json.response;
            if (registration !== (ceremony === 'registration'))
              throw new Error('Unexpected credential response.');
            subscriber.next(
              json as
                | PasskeyRegistrationCredentialDTO
                | PasskeyAuthenticationCredentialDTO,
            );
            subscriber.complete();
          } catch (error) {
            fail(error);
          }
        }, fail);
      } catch (error) {
        fail(error);
      }
      return () => controller.abort();
    });
  }
}
