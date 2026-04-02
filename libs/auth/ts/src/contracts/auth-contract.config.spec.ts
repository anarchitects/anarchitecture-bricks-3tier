import { describe, expect, it } from 'vitest';
import type { AuthContractConfig } from './auth-contract.config';
import { DefaultAuthContractConfig } from './auth-contract.config';

describe('DefaultAuthContractConfig', () => {
  it('satisfies the AuthContractConfig interface', () => {
    const config: AuthContractConfig = DefaultAuthContractConfig;
    expect(config).toBeDefined();
  });

  it('matches register defaults', () => {
    expect(DefaultAuthContractConfig.register.email).toEqual({
      required: true,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.register.password).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.register.confirmPassword).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.register.name).toEqual({
      required: false,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    });
  });

  it('matches login defaults', () => {
    expect(DefaultAuthContractConfig.login.credential).toEqual({
      required: true,
      minLength: 2,
      maxLength: 100,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.login.password).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });
  });

  it('matches forgot-password and reset-password defaults', () => {
    expect(DefaultAuthContractConfig.forgotPassword.email).toEqual({
      required: true,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.resetPassword.token).toEqual({
      required: true,
      minLength: 1,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.resetPassword.password).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.resetPassword.confirmPassword).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });
  });

  it('matches verify-email, change-password, and logout defaults', () => {
    expect(DefaultAuthContractConfig.verifyEmail.token).toEqual({
      required: true,
      minLength: 1,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.changePassword.currentPassword).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.changePassword.newPassword).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.changePassword.confirmPassword).toEqual({
      required: true,
      minLength: 6,
      emptyStringPolicy: 'reject',
    });

    expect(DefaultAuthContractConfig.logout).toEqual({});
  });
});
