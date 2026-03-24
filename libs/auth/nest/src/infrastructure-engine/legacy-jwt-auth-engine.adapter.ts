import { Injectable } from '@nestjs/common';
import type {
  LoginRequestDTO,
  LoginResponseDTO,
} from '@anarchitects/auth-ts/dtos';
import { JwtAuthService } from '../application/services/jwt-auth.service';
import {
  AuthEngineCapabilityReport,
  AuthEnginePort,
  AuthPasskeySignInInput,
  AuthSignOutOrRefreshInput,
  AuthSocialSignInInput,
} from '../application/services/auth-engine.port';

@Injectable()
export class LegacyJwtAuthEngineAdapter implements AuthEnginePort {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  async describeCapabilities(): Promise<AuthEngineCapabilityReport> {
    return {
      engine: 'legacy-jwt',
      flows: [
        {
          flow: 'password-sign-in',
          status: 'supported',
          notes: 'Existing JwtAuthService email-or-username login path.',
        },
        {
          flow: 'passkey-sign-in',
          status: 'unsupported',
          notes: 'Legacy JWT engine does not implement WebAuthn.',
        },
        {
          flow: 'social-sign-in',
          status: 'unsupported',
          notes:
            'Legacy JWT engine does not implement social provider sign-in.',
        },
        {
          flow: 'sign-out-or-refresh',
          status: 'supported',
          notes:
            'Existing refresh-token flow remains available on the legacy engine.',
        },
      ],
    };
  }

  passwordSignIn(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.jwtAuthService.login(dto);
  }

  passkeySignIn(_input: AuthPasskeySignInInput): Promise<unknown> {
    return Promise.reject(
      new Error('Passkey sign-in is unavailable on the legacy JWT engine.'),
    );
  }

  socialSignIn(_input: AuthSocialSignInInput): Promise<unknown> {
    return Promise.reject(
      new Error('Social sign-in is unavailable on the legacy JWT engine.'),
    );
  }

  signOutOrRefresh(input: AuthSignOutOrRefreshInput): Promise<unknown> {
    if (input.mode === 'refresh') {
      return this.jwtAuthService.refreshTokens(input.userId, input.dto);
    }

    return Promise.reject(
      new Error('Legacy JWT proof path only supports refresh for the spike.'),
    );
  }
}
