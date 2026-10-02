import type {
  PasskeyRegistrationBeginRequestDTO,
  PasskeyRegistrationFinishRequestDTO,
  PasskeyRegistrationFinishResponseDTO,
  PasskeyAuthenticationBeginRequestDTO,
  PasskeyAuthenticationFinishRequestDTO,
  PasskeyAuthenticationFinishResponseDTO,
} from '@anarchitects/auth-ts/dtos/passkeys';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthEnginePort } from './auth-engine.port';
import { AuthPrincipalResolver } from './auth-principal.resolver';
import type { AuthHttpResult } from './auth.service';
import { PoliciesService } from './policies.service';

/** Optional passkey ceremonies. Hosts must forward incoming cookies and returned headers. */
@Injectable()
export class AuthPasskeyService {
  constructor(
    private readonly engine: AuthEnginePort,
    private readonly principals: AuthPrincipalResolver,
    private readonly policies: PoliciesService,
  ) {}

  beginRegistration(
    dto: PasskeyRegistrationBeginRequestDTO,
    headers?: HeadersInit,
  ) {
    return this.engine.beginPasskeyRegistration(dto, headers);
  }

  async finishRegistration(
    dto: PasskeyRegistrationFinishRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<PasskeyRegistrationFinishResponseDTO>> {
    const result = await this.engine.finishPasskeyRegistration(dto, headers);
    return { body: { success: result.success }, headers: result.headers };
  }

  beginAuthentication(
    dto: PasskeyAuthenticationBeginRequestDTO,
    headers?: HeadersInit,
  ) {
    return this.engine.beginPasskeyAuthentication(dto, headers);
  }

  async finishAuthentication(
    dto: PasskeyAuthenticationFinishRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<PasskeyAuthenticationFinishResponseDTO>> {
    const session = await this.engine.finishPasskeyAuthentication(dto, headers);
    const user = await this.principals.resolveAuthUserById(session.userId);
    if (!user) {
      throw new UnauthorizedException('Passkey user is unavailable.');
    }
    return {
      body: { user, rbac: this.policies.rulesForLoadedAuthUser(user) },
      headers: session.headers,
    };
  }
}
