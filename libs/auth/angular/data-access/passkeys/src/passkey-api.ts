import {
  injectApiResourcePath,
  SUPPRESS_AUTH_FAILURE_REDIRECT,
} from '@anarchitects/auth-angular/config';
import { parsePolicyRuleArrayDTO } from '@anarchitects/auth-ts/dtos';
import type {
  PasskeyRegistrationBeginRequestDTO,
  PasskeyRegistrationBeginResponseDTO,
  PasskeyRegistrationFinishRequestDTO,
  PasskeyRegistrationFinishResponseDTO,
  PasskeyAuthenticationBeginResponseDTO,
  PasskeyAuthenticationFinishRequestDTO,
  PasskeyAuthenticationFinishResponseDTO,
} from '@anarchitects/auth-ts/dtos/passkeys';
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable()
export class PasskeyApi {
  private readonly http = inject(HttpClient);
  private readonly url = `/api/${injectApiResourcePath()}/passkeys`;
  private readonly options = {
    withCredentials: true,
    context: new HttpContext().set(SUPPRESS_AUTH_FAILURE_REDIRECT, true),
  };

  beginRegistration(dto: PasskeyRegistrationBeginRequestDTO = {}) {
    return this.http.post<PasskeyRegistrationBeginResponseDTO>(
      `${this.url}/registration/begin`,
      dto,
      this.options,
    );
  }
  finishRegistration(dto: PasskeyRegistrationFinishRequestDTO) {
    return this.http
      .post<PasskeyRegistrationFinishResponseDTO>(
        `${this.url}/registration/finish`,
        dto,
        this.options,
      )
      .pipe(
        map((body) => {
          if (body?.success !== true)
            throw new Error('Passkey registration was not completed.');
          return body;
        }),
      );
  }
  beginAuthentication() {
    return this.http.post<PasskeyAuthenticationBeginResponseDTO>(
      `${this.url}/authentication/begin`,
      {},
      this.options,
    );
  }
  finishAuthentication(dto: PasskeyAuthenticationFinishRequestDTO) {
    return this.http
      .post<PasskeyAuthenticationFinishResponseDTO>(
        `${this.url}/authentication/finish`,
        dto,
        this.options,
      )
      .pipe(
        map((body) => {
          const user = body?.user;
          if (
            !user ||
            typeof user !== 'object' ||
            !('id' in user) ||
            typeof user.id !== 'string' ||
            !user.id ||
            !('email' in user) ||
            typeof user.email !== 'string'
          ) {
            throw new Error('Invalid passkey session response.');
          }
          return {
            user: { id: user.id, email: user.email },
            rbac: parsePolicyRuleArrayDTO(body.rbac, 'rbac'),
          };
        }),
      );
  }
}
