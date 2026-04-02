import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';

import type {
  AuthContractConfig,
  EmptyStringPolicy,
} from './auth-contract.config';
import { DefaultAuthContractConfig } from './auth-contract.config';
import { createAuthContracts } from './auth-contracts.factory';

type Case = {
  label: string;
  schema: unknown;
  payload: unknown;
};

type BoundaryCase = {
  label: string;
  schema: unknown;
  valid: unknown;
  invalid: unknown;
};

function countErrors(schema: unknown, payload: unknown): number {
  return [...Value.Errors(schema as never, payload)].length;
}

function expectValid(schema: unknown, payload: unknown): void {
  expect(countErrors(schema, payload)).toBe(0);
}

function expectInvalid(schema: unknown, payload: unknown): void {
  expect(countErrors(schema, payload)).toBeGreaterThan(0);
}

function toStableSchemaSnapshotValue(schema: unknown): unknown {
  return JSON.parse(JSON.stringify(schema));
}

describe('createAuthContracts', () => {
  describe('with DefaultAuthContractConfig', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    const smokeCases: Case[] = [
      {
        label: 'register',
        schema: contracts.registerRequestSchema,
        payload: {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'login',
        schema: contracts.loginRequestSchema,
        payload: { credential: 'user@example.com', password: 'secret12' },
      },
      {
        label: 'forgot-password',
        schema: contracts.forgotPasswordRequestSchema,
        payload: { email: 'user@example.com' },
      },
      {
        label: 'reset-password',
        schema: contracts.resetPasswordRequestSchema,
        payload: {
          token: 'tok',
          password: 'secure12',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'verify-email',
        schema: contracts.verifyEmailRequestSchema,
        payload: { token: 'tok' },
      },
      {
        label: 'change-password',
        schema: contracts.changePasswordRequestSchema,
        payload: {
          currentPassword: 'secure12',
          newPassword: 'newpass1',
          confirmPassword: 'newpass1',
        },
      },
      {
        label: 'logout',
        schema: contracts.logoutRequestSchema,
        payload: {},
      },
    ];

    const requiredFieldCases: Case[] = [
      {
        label: 'register.email',
        schema: contracts.registerRequestSchema,
        payload: { password: 'secure12', confirmPassword: 'secure12' },
      },
      {
        label: 'register.password',
        schema: contracts.registerRequestSchema,
        payload: { email: 'user@example.com', confirmPassword: 'secure12' },
      },
      {
        label: 'register.confirmPassword',
        schema: contracts.registerRequestSchema,
        payload: { email: 'user@example.com', password: 'secure12' },
      },
      {
        label: 'login.credential',
        schema: contracts.loginRequestSchema,
        payload: { password: 'secure12' },
      },
      {
        label: 'login.password',
        schema: contracts.loginRequestSchema,
        payload: { credential: 'user@example.com' },
      },
      {
        label: 'forgotPassword.email',
        schema: contracts.forgotPasswordRequestSchema,
        payload: {},
      },
      {
        label: 'resetPassword.token',
        schema: contracts.resetPasswordRequestSchema,
        payload: { password: 'secure12', confirmPassword: 'secure12' },
      },
      {
        label: 'resetPassword.password',
        schema: contracts.resetPasswordRequestSchema,
        payload: { token: 'token123', confirmPassword: 'secure12' },
      },
      {
        label: 'resetPassword.confirmPassword',
        schema: contracts.resetPasswordRequestSchema,
        payload: { token: 'token123', password: 'secure12' },
      },
      {
        label: 'verifyEmail.token',
        schema: contracts.verifyEmailRequestSchema,
        payload: {},
      },
      {
        label: 'changePassword.currentPassword',
        schema: contracts.changePasswordRequestSchema,
        payload: { newPassword: 'secure12', confirmPassword: 'secure12' },
      },
      {
        label: 'changePassword.newPassword',
        schema: contracts.changePasswordRequestSchema,
        payload: { currentPassword: 'secure12', confirmPassword: 'secure12' },
      },
      {
        label: 'changePassword.confirmPassword',
        schema: contracts.changePasswordRequestSchema,
        payload: { currentPassword: 'secure12', newPassword: 'secure12' },
      },
    ];

    const boundaryCases: BoundaryCase[] = [
      {
        label: 'register.password minLength',
        schema: contracts.registerRequestSchema,
        valid: {
          email: 'user@example.com',
          password: '123456',
          confirmPassword: 'secure12',
        },
        invalid: {
          email: 'user@example.com',
          password: '12345',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'register.confirmPassword minLength',
        schema: contracts.registerRequestSchema,
        valid: {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: '123456',
        },
        invalid: {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: '12345',
        },
      },
      {
        label: 'register.name maxLength',
        schema: contracts.registerRequestSchema,
        valid: {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: 'secure12',
          name: 'a'.repeat(100),
        },
        invalid: {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: 'secure12',
          name: 'a'.repeat(101),
        },
      },
      {
        label: 'login.credential min/max',
        schema: contracts.loginRequestSchema,
        valid: { credential: 'a'.repeat(100), password: 'secure12' },
        invalid: { credential: 'a'.repeat(101), password: 'secure12' },
      },
      {
        label: 'login.password minLength',
        schema: contracts.loginRequestSchema,
        valid: { credential: 'user@example.com', password: '123456' },
        invalid: { credential: 'user@example.com', password: '12345' },
      },
      {
        label: 'resetPassword.token minLength',
        schema: contracts.resetPasswordRequestSchema,
        valid: {
          token: 't',
          password: 'secure12',
          confirmPassword: 'secure12',
        },
        invalid: {
          token: '',
          password: 'secure12',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'resetPassword.password minLength',
        schema: contracts.resetPasswordRequestSchema,
        valid: { token: 't', password: '123456', confirmPassword: 'secure12' },
        invalid: { token: 't', password: '12345', confirmPassword: 'secure12' },
      },
      {
        label: 'resetPassword.confirmPassword minLength',
        schema: contracts.resetPasswordRequestSchema,
        valid: { token: 't', password: 'secure12', confirmPassword: '123456' },
        invalid: { token: 't', password: 'secure12', confirmPassword: '12345' },
      },
      {
        label: 'verifyEmail.token minLength',
        schema: contracts.verifyEmailRequestSchema,
        valid: { token: 't' },
        invalid: { token: '' },
      },
      {
        label: 'changePassword.currentPassword minLength',
        schema: contracts.changePasswordRequestSchema,
        valid: {
          currentPassword: '123456',
          newPassword: 'secure12',
          confirmPassword: 'secure12',
        },
        invalid: {
          currentPassword: '12345',
          newPassword: 'secure12',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'changePassword.newPassword minLength',
        schema: contracts.changePasswordRequestSchema,
        valid: {
          currentPassword: 'secure12',
          newPassword: '123456',
          confirmPassword: 'secure12',
        },
        invalid: {
          currentPassword: 'secure12',
          newPassword: '12345',
          confirmPassword: 'secure12',
        },
      },
      {
        label: 'changePassword.confirmPassword minLength',
        schema: contracts.changePasswordRequestSchema,
        valid: {
          currentPassword: 'secure12',
          newPassword: 'secure12',
          confirmPassword: '123456',
        },
        invalid: {
          currentPassword: 'secure12',
          newPassword: 'secure12',
          confirmPassword: '12345',
        },
      },
    ];

    it.each(smokeCases)('accepts valid %s payload', ({ schema, payload }) => {
      expectValid(schema, payload);
    });

    it('rejects invalid register email format', () => {
      expectInvalid(contracts.registerRequestSchema, {
        email: 'not-an-email',
        password: 'secure12',
        confirmPassword: 'secure12',
      });
    });

    it('accepts register without optional name field', () => {
      expectValid(contracts.registerRequestSchema, {
        email: 'user@example.com',
        password: 'secure12',
        confirmPassword: 'secure12',
      });
    });

    it.each(requiredFieldCases)(
      'rejects payload missing required field %s',
      ({ schema, payload }) => {
        expectInvalid(schema, payload);
      },
    );

    it.each(boundaryCases)(
      'enforces boundary for %s',
      ({ schema, valid, invalid }) => {
        expectValid(schema, valid);
        expectInvalid(schema, invalid);
      },
    );

    it('keeps runtime required keys aligned with config intent', () => {
      expect(contracts.registerRequestSchema.required).toEqual([
        'email',
        'password',
        'confirmPassword',
      ]);
      expect(contracts.loginRequestSchema.required).toEqual([
        'credential',
        'password',
      ]);
      expect(contracts.forgotPasswordRequestSchema.required).toEqual(['email']);
      expect(contracts.resetPasswordRequestSchema.required).toEqual([
        'token',
        'password',
        'confirmPassword',
      ]);
      expect(contracts.verifyEmailRequestSchema.required).toEqual(['token']);
      expect(contracts.changePasswordRequestSchema.required).toEqual([
        'currentPassword',
        'newPassword',
        'confirmPassword',
      ]);
    });

    it('rejects extra properties in logout schema', () => {
      expectInvalid(contracts.logoutRequestSchema, { extra: true });
    });

    it('returns registerFormMeta reflecting default config values', () => {
      expect(contracts.registerFormMeta.name.required).toBe(false);
      expect(contracts.registerFormMeta.name.minLength).toBe(2);
      expect(contracts.registerFormMeta.name.maxLength).toBe(100);
      expect(contracts.registerFormMeta.password.required).toBe(true);
      expect(contracts.registerFormMeta.password.minLength).toBe(6);
      expect(contracts.registerFormMeta.email.emptyStringPolicy).toBe('reject');
    });

    it('returns loginFormMeta reflecting default config values', () => {
      expect(contracts.loginFormMeta.credential.minLength).toBe(2);
      expect(contracts.loginFormMeta.credential.maxLength).toBe(100);
      expect(contracts.loginFormMeta.password.minLength).toBe(6);
    });

    it('matches default schema snapshots for all required auth flows', () => {
      expect(
        toStableSchemaSnapshotValue(contracts.registerRequestSchema),
      ).toMatchSnapshot('default-register-schema');
      expect(
        toStableSchemaSnapshotValue(contracts.loginRequestSchema),
      ).toMatchSnapshot('default-login-schema');
      expect(
        toStableSchemaSnapshotValue(contracts.forgotPasswordRequestSchema),
      ).toMatchSnapshot('default-forgot-password-schema');
      expect(
        toStableSchemaSnapshotValue(contracts.resetPasswordRequestSchema),
      ).toMatchSnapshot('default-reset-password-schema');
      expect(
        toStableSchemaSnapshotValue(contracts.verifyEmailRequestSchema),
      ).toMatchSnapshot('default-verify-email-schema');
      expect(
        toStableSchemaSnapshotValue(contracts.changePasswordRequestSchema),
      ).toMatchSnapshot('default-change-password-schema');
    });
  });

  describe('with overridden config', () => {
    it('enforces name as required when overridden', () => {
      const customConfig: AuthContractConfig = {
        ...DefaultAuthContractConfig,
        register: {
          ...DefaultAuthContractConfig.register,
          name: {
            ...DefaultAuthContractConfig.register.name,
            required: true,
          },
        },
      };

      const contracts = createAuthContracts(customConfig);
      expectInvalid(contracts.registerRequestSchema, {
        email: 'user@example.com',
        password: 'secure12',
        confirmPassword: 'secure12',
      });
    });

    it('enforces raised login password minLength at runtime', () => {
      const customConfig: AuthContractConfig = {
        ...DefaultAuthContractConfig,
        login: {
          ...DefaultAuthContractConfig.login,
          password: {
            ...DefaultAuthContractConfig.login.password,
            minLength: 10,
          },
        },
      };

      const contracts = createAuthContracts(customConfig);
      expectInvalid(contracts.loginRequestSchema, {
        credential: 'user@example.com',
        password: '123456789',
      });
      expectValid(contracts.loginRequestSchema, {
        credential: 'user@example.com',
        password: '1234567890',
      });
    });

    it('reflects overridden minLength in metadata', () => {
      const customConfig: AuthContractConfig = {
        ...DefaultAuthContractConfig,
        login: {
          ...DefaultAuthContractConfig.login,
          password: {
            ...DefaultAuthContractConfig.login.password,
            minLength: 10,
          },
        },
      };

      const contracts = createAuthContracts(customConfig);
      expect(contracts.loginFormMeta.password.minLength).toBe(10);
    });

    it.each(['strip', 'reject', 'allow'] as const)(
      'propagates emptyStringPolicy=%s into form metadata',
      (policy: EmptyStringPolicy) => {
        const customConfig: AuthContractConfig = {
          ...DefaultAuthContractConfig,
          register: {
            ...DefaultAuthContractConfig.register,
            email: {
              ...DefaultAuthContractConfig.register.email,
              emptyStringPolicy: policy,
            },
          },
          login: {
            ...DefaultAuthContractConfig.login,
            credential: {
              ...DefaultAuthContractConfig.login.credential,
              emptyStringPolicy: policy,
            },
          },
          forgotPassword: {
            ...DefaultAuthContractConfig.forgotPassword,
            email: {
              ...DefaultAuthContractConfig.forgotPassword.email,
              emptyStringPolicy: policy,
            },
          },
          resetPassword: {
            ...DefaultAuthContractConfig.resetPassword,
            token: {
              ...DefaultAuthContractConfig.resetPassword.token,
              emptyStringPolicy: policy,
            },
          },
          verifyEmail: {
            ...DefaultAuthContractConfig.verifyEmail,
            token: {
              ...DefaultAuthContractConfig.verifyEmail.token,
              emptyStringPolicy: policy,
            },
          },
          changePassword: {
            ...DefaultAuthContractConfig.changePassword,
            newPassword: {
              ...DefaultAuthContractConfig.changePassword.newPassword,
              emptyStringPolicy: policy,
            },
          },
        };

        const contracts = createAuthContracts(customConfig);
        expect(contracts.registerFormMeta.email.emptyStringPolicy).toBe(policy);
        expect(contracts.loginFormMeta.credential.emptyStringPolicy).toBe(
          policy,
        );
        expect(contracts.forgotPasswordFormMeta.email.emptyStringPolicy).toBe(
          policy,
        );
        expect(contracts.resetPasswordFormMeta.token.emptyStringPolicy).toBe(
          policy,
        );
        expect(contracts.verifyEmailFormMeta.token.emptyStringPolicy).toBe(
          policy,
        );
        expect(
          contracts.changePasswordFormMeta.newPassword.emptyStringPolicy,
        ).toBe(policy);
      },
    );

    it('includes min/max metadata keys only when configured', () => {
      const customConfig: AuthContractConfig = {
        ...DefaultAuthContractConfig,
        register: {
          ...DefaultAuthContractConfig.register,
          name: {
            ...DefaultAuthContractConfig.register.name,
            minLength: undefined,
          },
        },
        login: {
          ...DefaultAuthContractConfig.login,
          credential: {
            ...DefaultAuthContractConfig.login.credential,
            maxLength: undefined,
          },
        },
      };

      const contracts = createAuthContracts(customConfig);
      expect(contracts.registerFormMeta.name).not.toHaveProperty('minLength');
      expect(contracts.registerFormMeta.name.maxLength).toBe(100);
      expect(contracts.loginFormMeta.credential.minLength).toBe(2);
      expect(contracts.loginFormMeta.credential).not.toHaveProperty(
        'maxLength',
      );
    });
  });
});
