import {
  ActivateUserRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';

type TokenContext = Readonly<{
  token?: string;
}>;

interface AuthFormBridge<TDto, TContext = undefined> {
  resolveFormConfig(context?: TContext): FormConfig;
  mapSubmission(
    input: SubmissionRequestDTO,
    context?: TContext,
  ): TDto | undefined;
}

const readPayloadString = (
  input: SubmissionRequestDTO,
  key: string,
): string | undefined => input.payload[key] as string | undefined;

const readStoredString = (key: string): string | undefined =>
  localStorage.getItem(key) || undefined;

const matchFieldsRule = (sourceField: string, targetField: string) => ({
  kind: 'matchFields' as const,
  sourceField,
  targetField,
  message: 'Passwords must match.',
});

const LOGIN_FORM_CONFIG: FormConfig = {
  id: 'login',
  version: 1,
  fields: [
    {
      name: 'credential',
      kind: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      ui: { label: 'Email or Username' },
    },
    {
      name: 'password',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: { label: 'Password' },
    },
  ],
};

const REGISTER_FORM_CONFIG: FormConfig = {
  id: 'register',
  version: 1,
  fields: [
    {
      name: 'userName',
      kind: 'string',
      ui: { label: 'Username' },
      required: false,
    },
    { name: 'email', kind: 'email', ui: { label: 'Email' }, required: true },
    {
      name: 'password',
      kind: 'password',
      ui: { label: 'Password' },
      required: true,
    },
    {
      name: 'confirmPassword',
      kind: 'password',
      ui: { label: 'Confirm Password' },
      required: true,
    },
  ],
  validationRules: [matchFieldsRule('password', 'confirmPassword')],
};

const CHANGE_PASSWORD_FORM_CONFIG: FormConfig = {
  id: 'change-password',
  version: 1,
  fields: [
    {
      name: 'currentPassword',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: { label: 'Current Password' },
    },
    {
      name: 'newPassword',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: { label: 'New Password' },
    },
    {
      name: 'confirmPassword',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: { label: 'Confirm Password' },
    },
  ],
  validationRules: [matchFieldsRule('newPassword', 'confirmPassword')],
};

const FORGOT_PASSWORD_FORM_CONFIG: FormConfig = {
  id: 'forgot-password',
  version: 1,
  fields: [
    {
      name: 'email',
      kind: 'email',
      required: true,
      ui: { label: 'Email' },
    },
  ],
};

const UPDATE_EMAIL_FORM_CONFIG: FormConfig = {
  id: 'update-email',
  version: 1,
  fields: [
    {
      name: 'newEmail',
      kind: 'email',
      required: true,
      ui: { label: 'New Email' },
    },
    {
      name: 'password',
      kind: 'password',
      required: true,
      minLength: 6,
      ui: { label: 'Password' },
    },
  ],
};

const LOGOUT_FORM_CONFIG: FormConfig = {
  id: 'logout',
  version: 1,
  fields: [
    {
      name: 'refreshToken',
      kind: 'string',
      required: false,
      minLength: 1,
      ui: { label: 'Refresh Token' },
    },
    {
      name: 'accessToken',
      kind: 'string',
      required: false,
      minLength: 1,
      ui: { label: 'Access Token (optional)' },
    },
  ],
};

const REFRESH_TOKENS_FORM_CONFIG: FormConfig = {
  id: 'refresh-tokens',
  version: 1,
  fields: [
    {
      name: 'refreshToken',
      kind: 'string',
      required: false,
      minLength: 1,
      ui: { label: 'Refresh Token' },
    },
  ],
};

const resolveToken = (
  input: SubmissionRequestDTO,
  fallbackToken?: string,
): string | undefined => readPayloadString(input, 'token') || fallbackToken;

export const loginFormBridge: AuthFormBridge<LoginRequestDTO> = {
  resolveFormConfig: () => LOGIN_FORM_CONFIG,
  mapSubmission: (input) => ({
    credential: readPayloadString(input, 'credential') as string,
    password: readPayloadString(input, 'password') as string,
  }),
};

export const registerFormBridge: AuthFormBridge<RegisterRequestDTO> = {
  resolveFormConfig: () => REGISTER_FORM_CONFIG,
  mapSubmission: (input) => ({
    userName: readPayloadString(input, 'userName'),
    email: readPayloadString(input, 'email') as string,
    password: readPayloadString(input, 'password') as string,
    confirmPassword: readPayloadString(input, 'confirmPassword') as string,
  }),
};

export const activateUserFormBridge: AuthFormBridge<
  ActivateUserRequestDTO,
  TokenContext
> = {
  resolveFormConfig: (context) => ({
    id: 'activate-user',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !context?.token,
        minLength: 1,
        ui: { label: 'Activation Token' },
      },
    ],
  }),
  mapSubmission: (input, context) => {
    const token = resolveToken(input, context?.token);
    if (!token) {
      return undefined;
    }

    return { token };
  },
};

export const forgotPasswordFormBridge: AuthFormBridge<ForgotPasswordRequestDTO> =
  {
    resolveFormConfig: () => FORGOT_PASSWORD_FORM_CONFIG,
    mapSubmission: (input) => ({
      email: readPayloadString(input, 'email') as string,
    }),
  };

export const resetPasswordFormBridge: AuthFormBridge<
  ResetPasswordRequestDTO,
  TokenContext
> = {
  resolveFormConfig: (context) => ({
    id: 'reset-password',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !context?.token,
        minLength: 1,
        ui: { label: 'Reset Token' },
      },
      {
        name: 'password',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Password' },
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Confirm Password' },
      },
    ],
    validationRules: [matchFieldsRule('password', 'confirmPassword')],
  }),
  mapSubmission: (input, context) => {
    const token = resolveToken(input, context?.token);
    if (!token) {
      return undefined;
    }

    return {
      token,
      password: readPayloadString(input, 'password') as string,
      confirmPassword: readPayloadString(input, 'confirmPassword') as string,
    };
  },
};

export const verifyEmailFormBridge: AuthFormBridge<
  VerifyEmailRequestDTO,
  TokenContext
> = {
  resolveFormConfig: (context) => ({
    id: 'verify-email',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !context?.token,
        minLength: 1,
        ui: { label: 'Verification Token' },
      },
    ],
  }),
  mapSubmission: (input, context) => {
    const token = resolveToken(input, context?.token);
    if (!token) {
      return undefined;
    }

    return { token };
  },
};

export const changePasswordFormBridge: AuthFormBridge<ChangePasswordRequestDTO> =
  {
    resolveFormConfig: () => CHANGE_PASSWORD_FORM_CONFIG,
    mapSubmission: (input) => ({
      currentPassword: readPayloadString(input, 'currentPassword') as string,
      newPassword: readPayloadString(input, 'newPassword') as string,
      confirmPassword: readPayloadString(input, 'confirmPassword') as string,
    }),
  };

export const updateEmailFormBridge: AuthFormBridge<UpdateEmailRequestDTO> = {
  resolveFormConfig: () => UPDATE_EMAIL_FORM_CONFIG,
  mapSubmission: (input) => ({
    newEmail: readPayloadString(input, 'newEmail') as string,
    password: readPayloadString(input, 'password'),
  }),
};

export const logoutFormBridge: AuthFormBridge<LogoutRequestDTO> = {
  resolveFormConfig: () => LOGOUT_FORM_CONFIG,
  mapSubmission: (input) => {
    const refreshToken =
      readPayloadString(input, 'refreshToken') || readStoredString('refreshToken');
    const accessToken =
      readPayloadString(input, 'accessToken') || readStoredString('accessToken');

    if (!refreshToken) {
      return undefined;
    }

    return {
      refreshToken,
      ...(accessToken ? { accessToken } : {}),
    };
  },
};

export const refreshTokensFormBridge: AuthFormBridge<RefreshTokenRequestDTO> = {
  resolveFormConfig: () => REFRESH_TOKENS_FORM_CONFIG,
  mapSubmission: (input) => {
    const refreshToken =
      readPayloadString(input, 'refreshToken') || readStoredString('refreshToken');

    if (!refreshToken) {
      return undefined;
    }

    return { refreshToken };
  },
};
