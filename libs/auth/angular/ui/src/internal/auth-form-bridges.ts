import {
  ActivateUserRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { type ResolvedAuthContracts } from '@anarchitects/auth-angular/config';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig, type FormField } from '@anarchitects/forms-ts/models';

type TokenContext = Readonly<{
  token?: string;
}>;

interface AuthFormBridge<TDto, TContext = undefined> {
  resolveFormConfig(
    contracts?: ResolvedAuthContracts,
    context?: TContext,
  ): FormConfig;
  mapSubmission(
    input: SubmissionRequestDTO,
    contracts?: ResolvedAuthContracts,
    context?: TContext,
  ): TDto | undefined;
}

const readPayloadString = (
  input: SubmissionRequestDTO,
  key: string,
): string | undefined => input.payload[key] as string | undefined;

const matchFieldsRule = (sourceField: string, targetField: string) => ({
  kind: 'matchFields' as const,
  sourceField,
  targetField,
  message: 'Passwords must match.',
});

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
  fields: [],
};

const resolveToken = (
  input: SubmissionRequestDTO,
  fallbackToken?: string,
): string | undefined => readPayloadString(input, 'token') || fallbackToken;

type AuthFieldMeta = ResolvedAuthContracts['registerFormMeta']['email'];

const requireContracts = (
  contracts?: ResolvedAuthContracts,
): ResolvedAuthContracts => {
  if (!contracts) {
    throw new Error('Auth contracts are required to resolve auth form config.');
  }

  return contracts;
};

const toFormField = (
  name: string,
  kind: FormField['kind'],
  label: string,
  meta: AuthFieldMeta,
  overrides: Partial<FormField> = {},
): FormField => ({
  name,
  kind,
  required: meta.required,
  minLength: meta.minLength,
  maxLength: meta.maxLength,
  ui: { label },
  ...overrides,
});

export const loginFormBridge: AuthFormBridge<LoginRequestDTO> = {
  resolveFormConfig: (contracts) => {
    const resolvedContracts = requireContracts(contracts);

    return {
      id: 'login',
      version: 1,
      fields: [
        toFormField(
          'credential',
          'string',
          'Email or Username',
          resolvedContracts.loginFormMeta.credential,
        ),
        toFormField(
          'password',
          'password',
          'Password',
          resolvedContracts.loginFormMeta.password,
        ),
      ],
    };
  },
  mapSubmission: (input) => ({
    credential: readPayloadString(input, 'credential') as string,
    password: readPayloadString(input, 'password') as string,
  }),
};

export const registerFormBridge: AuthFormBridge<RegisterRequestDTO> = {
  resolveFormConfig: (contracts) => {
    const resolvedContracts = requireContracts(contracts);

    return {
      id: 'register',
      version: 1,
      fields: [
        toFormField(
          'name',
          'string',
          'Name',
          resolvedContracts.registerFormMeta.name,
        ),
        toFormField(
          'email',
          'email',
          'Email',
          resolvedContracts.registerFormMeta.email,
        ),
        toFormField(
          'password',
          'password',
          'Password',
          resolvedContracts.registerFormMeta.password,
        ),
        toFormField(
          'confirmPassword',
          'password',
          'Confirm Password',
          resolvedContracts.registerFormMeta.confirmPassword,
        ),
      ],
      validationRules: [matchFieldsRule('password', 'confirmPassword')],
    };
  },
  mapSubmission: (input) => ({
    name: readPayloadString(input, 'name'),
    email: readPayloadString(input, 'email') as string,
    password: readPayloadString(input, 'password') as string,
    confirmPassword: readPayloadString(input, 'confirmPassword') as string,
  }),
};

export const activateUserFormBridge: AuthFormBridge<
  ActivateUserRequestDTO,
  TokenContext
> = {
  resolveFormConfig: (_contracts, context) => ({
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
  mapSubmission: (input, _contracts, context) => {
    const token = resolveToken(input, context?.token);
    if (!token) {
      return undefined;
    }

    return { token };
  },
};

export const forgotPasswordFormBridge: AuthFormBridge<ForgotPasswordRequestDTO> =
  {
    resolveFormConfig: (contracts) => {
      const resolvedContracts = requireContracts(contracts);

      return {
        id: 'forgot-password',
        version: 1,
        fields: [
          toFormField(
            'email',
            'email',
            'Email',
            resolvedContracts.forgotPasswordFormMeta.email,
          ),
        ],
      };
    },
    mapSubmission: (input) => ({
      email: readPayloadString(input, 'email') as string,
    }),
  };

export const resetPasswordFormBridge: AuthFormBridge<
  ResetPasswordRequestDTO,
  TokenContext
> = {
  resolveFormConfig: (contracts, context) => {
    const resolvedContracts = requireContracts(contracts);

    return {
      id: 'reset-password',
      version: 1,
      fields: [
        toFormField(
          'token',
          'string',
          'Reset Token',
          resolvedContracts.resetPasswordFormMeta.token,
          {
            required: context?.token
              ? false
              : resolvedContracts.resetPasswordFormMeta.token.required,
          },
        ),
        toFormField(
          'password',
          'password',
          'Password',
          resolvedContracts.resetPasswordFormMeta.password,
        ),
        toFormField(
          'confirmPassword',
          'password',
          'Confirm Password',
          resolvedContracts.resetPasswordFormMeta.confirmPassword,
        ),
      ],
      validationRules: [matchFieldsRule('password', 'confirmPassword')],
    };
  },
  mapSubmission: (input, _contracts, context) => {
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
  resolveFormConfig: (contracts, context) => {
    const resolvedContracts = requireContracts(contracts);

    return {
      id: 'verify-email',
      version: 1,
      fields: [
        toFormField(
          'token',
          'string',
          'Verification Token',
          resolvedContracts.verifyEmailFormMeta.token,
          {
            required: context?.token
              ? false
              : resolvedContracts.verifyEmailFormMeta.token.required,
          },
        ),
      ],
    };
  },
  mapSubmission: (input, _contracts, context) => {
    const token = resolveToken(input, context?.token);
    if (!token) {
      return undefined;
    }

    return { token };
  },
};

export const changePasswordFormBridge: AuthFormBridge<ChangePasswordRequestDTO> =
  {
    resolveFormConfig: (contracts) => {
      const resolvedContracts = requireContracts(contracts);

      return {
        id: 'change-password',
        version: 1,
        fields: [
          toFormField(
            'currentPassword',
            'password',
            'Current Password',
            resolvedContracts.changePasswordFormMeta.currentPassword,
          ),
          toFormField(
            'newPassword',
            'password',
            'New Password',
            resolvedContracts.changePasswordFormMeta.newPassword,
          ),
          toFormField(
            'confirmPassword',
            'password',
            'Confirm Password',
            resolvedContracts.changePasswordFormMeta.confirmPassword,
          ),
        ],
        validationRules: [matchFieldsRule('newPassword', 'confirmPassword')],
      };
    },
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
  mapSubmission: () => ({}),
};
