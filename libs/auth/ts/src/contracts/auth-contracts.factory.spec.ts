import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';

import type { AuthContractConfig } from './auth-contract.config';
import { DefaultAuthContractConfig } from './auth-contract.config';
import { createAuthContracts } from './auth-contracts.factory';

describe('createAuthContracts', () => {
  describe('with DefaultAuthContractConfig', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    it('produces registerRequestSchema identical to the hard-coded baseline', () => {
      const valid = {
        email: 'user@example.com',
        password: 'secure12',
        confirmPassword: 'secure12',
      };
      expect([
        ...Value.Errors(contracts.registerRequestSchema, valid),
      ]).toHaveLength(0);
    });

    it('rejects register payload with invalid email', () => {
      expect(
        [
          ...Value.Errors(contracts.registerRequestSchema, {
            email: 'not-an-email',
            password: 'secure12',
            confirmPassword: 'secure12',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('rejects register payload with short password', () => {
      expect(
        [
          ...Value.Errors(contracts.registerRequestSchema, {
            email: 'user@example.com',
            password: '12345',
            confirmPassword: 'secure12',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('allows register without name (optional field)', () => {
      expect([
        ...Value.Errors(contracts.registerRequestSchema, {
          email: 'user@example.com',
          password: 'secure12',
          confirmPassword: 'secure12',
        }),
      ]).toHaveLength(0);
    });

    it('rejects register name shorter than minLength 2', () => {
      expect(
        [
          ...Value.Errors(contracts.registerRequestSchema, {
            email: 'user@example.com',
            password: 'secure12',
            confirmPassword: 'secure12',
            name: 'A',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('produces loginRequestSchema identical to the hard-coded baseline', () => {
      const valid = { credential: 'user@example.com', password: 'secret12' };
      expect([
        ...Value.Errors(contracts.loginRequestSchema, valid),
      ]).toHaveLength(0);
      expect(
        [
          ...Value.Errors(contracts.loginRequestSchema, {
            credential: 'a',
            password: 'secret12',
          }),
        ].length,
      ).toBeGreaterThan(0);
      expect(
        [
          ...Value.Errors(contracts.loginRequestSchema, {
            credential: 'user@example.com',
            password: 'short',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('produces forgotPasswordRequestSchema identical to baseline', () => {
      expect([
        ...Value.Errors(contracts.forgotPasswordRequestSchema, {
          email: 'user@example.com',
        }),
      ]).toHaveLength(0);
      expect(
        [
          ...Value.Errors(contracts.forgotPasswordRequestSchema, {
            email: 'bad',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('produces resetPasswordRequestSchema identical to baseline', () => {
      const valid = {
        token: 'tok',
        password: 'secure12',
        confirmPassword: 'secure12',
      };
      expect([
        ...Value.Errors(contracts.resetPasswordRequestSchema, valid),
      ]).toHaveLength(0);
      expect(
        [
          ...Value.Errors(contracts.resetPasswordRequestSchema, {
            ...valid,
            password: 'hi',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('produces verifyEmailRequestSchema identical to baseline', () => {
      expect([
        ...Value.Errors(contracts.verifyEmailRequestSchema, { token: 't' }),
      ]).toHaveLength(0);
      expect(
        [...Value.Errors(contracts.verifyEmailRequestSchema, { token: '' })]
          .length,
      ).toBeGreaterThan(0);
    });

    it('produces changePasswordRequestSchema identical to baseline', () => {
      const valid = {
        currentPassword: 'secure12',
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      };
      expect([
        ...Value.Errors(contracts.changePasswordRequestSchema, valid),
      ]).toHaveLength(0);
      expect(
        [
          ...Value.Errors(contracts.changePasswordRequestSchema, {
            ...valid,
            newPassword: '12345',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('produces logoutRequestSchema (empty body, no extra properties)', () => {
      expect([...Value.Errors(contracts.logoutRequestSchema, {})]).toHaveLength(
        0,
      );
    });

    it('returns registerFormMeta reflecting config values', () => {
      expect(contracts.registerFormMeta.name.required).toBe(false);
      expect(contracts.registerFormMeta.name.minLength).toBe(2);
      expect(contracts.registerFormMeta.name.maxLength).toBe(100);
      expect(contracts.registerFormMeta.password.required).toBe(true);
      expect(contracts.registerFormMeta.password.minLength).toBe(6);
      expect(contracts.registerFormMeta.email.emptyStringPolicy).toBe('reject');
    });

    it('returns loginFormMeta reflecting config values', () => {
      expect(contracts.loginFormMeta.credential.minLength).toBe(2);
      expect(contracts.loginFormMeta.credential.maxLength).toBe(100);
      expect(contracts.loginFormMeta.password.minLength).toBe(6);
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
      expect(
        [
          ...Value.Errors(contracts.registerRequestSchema, {
            email: 'user@example.com',
            password: 'secure12',
            confirmPassword: 'secure12',
          }),
        ].length,
      ).toBeGreaterThan(0);
    });

    it('accepts a longer minimum password when minLength is raised', () => {
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
      // 9 chars – below custom threshold
      expect(
        [
          ...Value.Errors(contracts.loginRequestSchema, {
            credential: 'user@example.com',
            password: '123456789',
          }),
        ].length,
      ).toBeGreaterThan(0);
      // 10 chars – at custom threshold
      expect([
        ...Value.Errors(contracts.loginRequestSchema, {
          credential: 'user@example.com',
          password: '1234567890',
        }),
      ]).toHaveLength(0);
    });

    it('reflects overridden constraint in form metadata', () => {
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
  });
});
