import { createAuthContracts as createCanonicalAuthContracts } from '@anarchitects/auth-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import { type TObject, type TOptional, type TString } from '@sinclair/typebox';

import type {
  AuthContractConfig,
  AuthFieldConfig,
  EmptyStringPolicy,
} from './auth-contract.config.js';

// ---- Field meta types --------------------------------------------------------

export type AuthFieldMeta = {
  readonly required: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly emptyStringPolicy: EmptyStringPolicy;
};

export type RegisterFormMeta = {
  readonly email: AuthFieldMeta;
  readonly password: AuthFieldMeta;
  readonly confirmPassword: AuthFieldMeta;
  readonly name: AuthFieldMeta;
};

export type LoginFormMeta = {
  readonly credential: AuthFieldMeta;
  readonly password: AuthFieldMeta;
};

export type ForgotPasswordFormMeta = {
  readonly email: AuthFieldMeta;
};

export type ResetPasswordFormMeta = {
  readonly token: AuthFieldMeta;
  readonly password: AuthFieldMeta;
  readonly confirmPassword: AuthFieldMeta;
};

export type VerifyEmailFormMeta = {
  readonly token: AuthFieldMeta;
};

export type ChangePasswordFormMeta = {
  readonly currentPassword: AuthFieldMeta;
  readonly newPassword: AuthFieldMeta;
  readonly confirmPassword: AuthFieldMeta;
};

// ---- Internal helpers --------------------------------------------------------

function toMeta(config: AuthFieldConfig): AuthFieldMeta {
  return {
    required: config.required,
    ...(config.minLength !== undefined && { minLength: config.minLength }),
    ...(config.maxLength !== undefined && { maxLength: config.maxLength }),
    emptyStringPolicy: config.emptyStringPolicy,
  };
}

type FieldSchema<F extends AuthFieldConfig> = F['required'] extends true
  ? TString
  : TOptional<TString>;

type RegisterRequestSchema<C extends AuthContractConfig> = TObject<{
  email: FieldSchema<C['register']['email']>;
  password: FieldSchema<C['register']['password']>;
  confirmPassword: FieldSchema<C['register']['confirmPassword']>;
  name: FieldSchema<C['register']['name']>;
}>;

type LoginRequestSchema<C extends AuthContractConfig> = TObject<{
  credential: FieldSchema<C['login']['credential']>;
  password: FieldSchema<C['login']['password']>;
}>;

type ForgotPasswordRequestSchema<C extends AuthContractConfig> = TObject<{
  email: FieldSchema<C['forgotPassword']['email']>;
}>;

type ResetPasswordRequestSchema<C extends AuthContractConfig> = TObject<{
  token: FieldSchema<C['resetPassword']['token']>;
  password: FieldSchema<C['resetPassword']['password']>;
  confirmPassword: FieldSchema<C['resetPassword']['confirmPassword']>;
}>;

type VerifyEmailRequestSchema<C extends AuthContractConfig> = TObject<{
  token: FieldSchema<C['verifyEmail']['token']>;
}>;

type ChangePasswordRequestSchema<C extends AuthContractConfig> = TObject<{
  currentPassword: FieldSchema<C['changePassword']['currentPassword']>;
  newPassword: FieldSchema<C['changePassword']['newPassword']>;
  confirmPassword: FieldSchema<C['changePassword']['confirmPassword']>;
}>;

type EmptySchemaProperties = Record<never, never>;

export type AuthContracts<C extends AuthContractConfig = AuthContractConfig> = {
  registerRequestSchema: RegisterRequestSchema<C>;
  registerFormMeta: RegisterFormMeta;
  loginRequestSchema: LoginRequestSchema<C>;
  loginFormMeta: LoginFormMeta;
  forgotPasswordRequestSchema: ForgotPasswordRequestSchema<C>;
  forgotPasswordFormMeta: ForgotPasswordFormMeta;
  resetPasswordRequestSchema: ResetPasswordRequestSchema<C>;
  resetPasswordFormMeta: ResetPasswordFormMeta;
  verifyEmailRequestSchema: VerifyEmailRequestSchema<C>;
  verifyEmailFormMeta: VerifyEmailFormMeta;
  changePasswordRequestSchema: ChangePasswordRequestSchema<C>;
  changePasswordFormMeta: ChangePasswordFormMeta;
  logoutRequestSchema: TObject<EmptySchemaProperties>;
};

/** TypeBox and form bindings derived from the published canonical profile. */
export function createAuthContracts<C extends AuthContractConfig>(config: C) {
  const canonical = createCanonicalAuthContracts(config);
  const result: Record<string, unknown> = {};
  for (const operation of [
    'register',
    'login',
    'forgotPassword',
    'resetPassword',
    'verifyEmail',
    'changePassword',
    'logout',
  ] as const) {
    result[`${operation}RequestSchema`] = canonicalTypeBox(
      canonical[`${operation}RequestSchema`],
    );
    if (operation !== 'logout') {
      result[`${operation}FormMeta`] = Object.fromEntries(
        Object.entries(canonical.config[operation]).map(([key, field]) => [
          key,
          toMeta(field),
        ]),
      );
    }
  }
  return result as AuthContracts<C>;
}
