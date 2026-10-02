import { Injectable } from '@nestjs/common';
import type {
  PasskeyRegistrationBeginRequestDTO,
  PasskeyRegistrationBeginResponseDTO,
  PasskeyRegistrationFinishRequestDTO,
  PasskeyAuthenticationBeginRequestDTO,
  PasskeyAuthenticationBeginResponseDTO,
  PasskeyAuthenticationFinishRequestDTO,
} from '@anarchitects/auth-ts/dtos/passkeys';
import type { AuthHttpResult } from './auth.service';
import {
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from '@anarchitects/auth-ts/dtos';

export type AuthEngineFlowName =
  | 'password-sign-in'
  | 'passkey-sign-in'
  | 'social-sign-in'
  | 'sign-out';

export type AuthEngineFlowSupport = {
  flow: AuthEngineFlowName;
  status: 'supported' | 'unsupported' | 'needs-config';
  notes: string;
};

export type AuthEngineCapabilityReport = {
  engine: 'better-auth';
  flows: AuthEngineFlowSupport[];
};

export type AuthEngineSessionResult = {
  userId: string;
  headers?: Headers;
};

export type AuthEngineMutationResult = {
  success: boolean;
  headers?: Headers;
  userId?: string;
};

export type AuthSocialSignInInput = {
  provider: 'github';
  callbackURL: string;
  errorCallbackURL?: string;
  newUserCallbackURL?: string;
  headers?: HeadersInit;
};

@Injectable()
export abstract class AuthEnginePort {
  abstract register(
    dto: RegisterRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult>;
  abstract login(
    dto: LoginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineSessionResult>;
  abstract logout(
    _dto: LogoutRequestDTO,
    headers?: HeadersInit,
  ): Promise<{ success: boolean; headers?: Headers }>;
  abstract getSession(
    headers?: HeadersInit,
  ): Promise<AuthEngineSessionResult | null>;
  abstract requestPasswordReset(
    dto: ForgotPasswordRequestDTO,
  ): Promise<AuthEngineMutationResult>;
  abstract resetPassword(
    dto: ResetPasswordRequestDTO,
  ): Promise<AuthEngineMutationResult>;
  abstract verifyEmail(
    token: string,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult>;

  abstract describeCapabilities(): Promise<AuthEngineCapabilityReport>;
  abstract passwordSignIn(
    dto: LoginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineSessionResult>;
  abstract beginPasskeyRegistration(
    dto: PasskeyRegistrationBeginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<PasskeyRegistrationBeginResponseDTO>>;
  abstract finishPasskeyRegistration(
    dto: PasskeyRegistrationFinishRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult>;
  abstract beginPasskeyAuthentication(
    dto: PasskeyAuthenticationBeginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<PasskeyAuthenticationBeginResponseDTO>>;
  abstract finishPasskeyAuthentication(
    dto: PasskeyAuthenticationFinishRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineSessionResult>;
  abstract socialSignIn(input: AuthSocialSignInInput): Promise<unknown>;
}
