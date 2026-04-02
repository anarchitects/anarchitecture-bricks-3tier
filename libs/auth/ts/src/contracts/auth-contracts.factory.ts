import { type TOptional, type TString, Type } from '@sinclair/typebox';

import type {
  AuthContractConfig,
  AuthFieldConfig,
  EmptyStringPolicy,
} from './auth-contract.config';

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

type StrOpts = { minLength?: number; maxLength?: number; format?: string };

function strField(
  config: AuthFieldConfig & { required: true },
  extra?: StrOpts,
): TString;
function strField(
  config: AuthFieldConfig & { required: false },
  extra?: StrOpts,
): TOptional<TString>;
function strField(
  config: AuthFieldConfig,
  extra?: StrOpts,
): TString | TOptional<TString>;
function strField(
  config: AuthFieldConfig,
  extra: StrOpts = {},
): TString | TOptional<TString> {
  const opts: StrOpts = {};
  if (config.minLength !== undefined) opts.minLength = config.minLength;
  if (config.maxLength !== undefined) opts.maxLength = config.maxLength;
  if (extra.format !== undefined) opts.format = extra.format;
  const base = Type.String(opts);
  return config.required ? base : Type.Optional(base);
}

// ---- Factory -----------------------------------------------------------------

export function createAuthContracts<C extends AuthContractConfig>(config: C) {
  // Register
  const registerRequestSchema = Type.Object({
    email: strField(config.register.email, { format: 'email' }),
    password: strField(config.register.password),
    confirmPassword: strField(config.register.confirmPassword),
    name: strField(config.register.name),
  });
  const registerFormMeta: RegisterFormMeta = {
    email: toMeta(config.register.email),
    password: toMeta(config.register.password),
    confirmPassword: toMeta(config.register.confirmPassword),
    name: toMeta(config.register.name),
  };

  // Login
  const loginRequestSchema = Type.Object({
    credential: strField(config.login.credential),
    password: strField(config.login.password),
  });
  const loginFormMeta: LoginFormMeta = {
    credential: toMeta(config.login.credential),
    password: toMeta(config.login.password),
  };

  // Forgot password
  const forgotPasswordRequestSchema = Type.Object({
    email: strField(config.forgotPassword.email, { format: 'email' }),
  });
  const forgotPasswordFormMeta: ForgotPasswordFormMeta = {
    email: toMeta(config.forgotPassword.email),
  };

  // Reset password
  const resetPasswordRequestSchema = Type.Object({
    token: strField(config.resetPassword.token),
    password: strField(config.resetPassword.password),
    confirmPassword: strField(config.resetPassword.confirmPassword),
  });
  const resetPasswordFormMeta: ResetPasswordFormMeta = {
    token: toMeta(config.resetPassword.token),
    password: toMeta(config.resetPassword.password),
    confirmPassword: toMeta(config.resetPassword.confirmPassword),
  };

  // Verify email
  const verifyEmailRequestSchema = Type.Object({
    token: strField(config.verifyEmail.token),
  });
  const verifyEmailFormMeta: VerifyEmailFormMeta = {
    token: toMeta(config.verifyEmail.token),
  };

  // Change password
  const changePasswordRequestSchema = Type.Object({
    currentPassword: strField(config.changePassword.currentPassword),
    newPassword: strField(config.changePassword.newPassword),
    confirmPassword: strField(config.changePassword.confirmPassword),
  });
  const changePasswordFormMeta: ChangePasswordFormMeta = {
    currentPassword: toMeta(config.changePassword.currentPassword),
    newPassword: toMeta(config.changePassword.newPassword),
    confirmPassword: toMeta(config.changePassword.confirmPassword),
  };

  // Logout (no configurable fields - fixed empty schema)
  const logoutRequestSchema = Type.Object({}, { additionalProperties: false });

  return {
    registerRequestSchema,
    registerFormMeta,
    loginRequestSchema,
    loginFormMeta,
    forgotPasswordRequestSchema,
    forgotPasswordFormMeta,
    resetPasswordRequestSchema,
    resetPasswordFormMeta,
    verifyEmailRequestSchema,
    verifyEmailFormMeta,
    changePasswordRequestSchema,
    changePasswordFormMeta,
    logoutRequestSchema,
  };
}

export type AuthContracts = ReturnType<typeof createAuthContracts>;
