import { Injectable } from '@nestjs/common';
import {
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos';

export type AuthEngineFlowName =
  | 'password-sign-in'
  | 'passkey-sign-in'
  | 'social-sign-in'
  | 'sign-out-or-refresh';

export type AuthEngineFlowSupport = {
  flow: AuthEngineFlowName;
  status: 'supported' | 'unsupported' | 'needs-config';
  notes: string;
};

export type AuthEngineCapabilityReport = {
  engine: 'legacy-jwt' | 'better-auth';
  flows: AuthEngineFlowSupport[];
};

export type AuthPasskeySignInInput = {
  autoFill?: boolean;
  headers?: HeadersInit;
};

export type AuthSocialSignInInput = {
  provider: 'github';
  callbackURL: string;
  errorCallbackURL?: string;
  newUserCallbackURL?: string;
  headers?: HeadersInit;
};

export type AuthSignOutOrRefreshInput =
  | { mode: 'refresh'; userId: string; dto: RefreshTokenRequestDTO }
  | { mode: 'sign-out'; headers?: HeadersInit };

@Injectable()
export abstract class AuthEnginePort {
  abstract describeCapabilities(): Promise<AuthEngineCapabilityReport>;

  abstract passwordSignIn(dto: LoginRequestDTO): Promise<LoginResponseDTO>;

  abstract passkeySignIn(input: AuthPasskeySignInInput): Promise<unknown>;

  abstract socialSignIn(input: AuthSocialSignInInput): Promise<unknown>;

  abstract signOutOrRefresh(input: AuthSignOutOrRefreshInput): Promise<unknown>;
}
