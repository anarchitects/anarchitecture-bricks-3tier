import { describe, expect, it } from 'vitest';
import { createAuthContracts } from './auth-contracts.factory';
import { DefaultAuthContractConfig } from './auth-contract.config';
import { shapeAuthPayload } from './shape-auth-payload';

describe('shapeAuthPayload', () => {
  it('strips empty optional fields when policy is strip', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      register: {
        ...DefaultAuthContractConfig.register,
        name: {
          ...DefaultAuthContractConfig.register.name,
          emptyStringPolicy: 'strip',
        },
      },
    });

    expect(
      shapeAuthPayload(
        {
          name: '',
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        },
        contracts.registerFormMeta,
      ),
    ).toEqual({
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('throws for empty optional fields when policy is reject', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(() =>
      shapeAuthPayload(
        {
          name: '',
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        },
        contracts.registerFormMeta,
      ),
    ).toThrow(/name/);
  });

  it('keeps empty optional fields when policy is allow', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      forgotPassword: {
        email: {
          ...DefaultAuthContractConfig.forgotPassword.email,
          required: false,
          emptyStringPolicy: 'allow',
        },
      },
    });

    expect(
      shapeAuthPayload(
        {
          email: '',
        },
        contracts.forgotPasswordFormMeta,
      ),
    ).toEqual({
      email: '',
    });
  });

  it('strips null optional fields when policy is strip', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      register: {
        ...DefaultAuthContractConfig.register,
        name: {
          ...DefaultAuthContractConfig.register.name,
          emptyStringPolicy: 'strip',
        },
      },
    });

    expect(
      shapeAuthPayload(
        {
          name: null,
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        },
        contracts.registerFormMeta,
      ),
    ).toEqual({
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('throws for null optional fields when policy is reject', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(() =>
      shapeAuthPayload(
        {
          name: null,
          email: 'jane@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
        },
        contracts.registerFormMeta,
      ),
    ).toThrow(/name/);
  });

  it('normalizes null optional fields to empty strings when policy is allow', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      forgotPassword: {
        email: {
          ...DefaultAuthContractConfig.forgotPassword.email,
          required: false,
          emptyStringPolicy: 'allow',
        },
      },
    });

    expect(
      shapeAuthPayload(
        {
          email: null,
        },
        contracts.forgotPasswordFormMeta,
      ),
    ).toEqual({
      email: '',
    });
  });

  it('leaves required fields unchanged even when they are empty strings', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(
      shapeAuthPayload(
        {
          credential: '',
          password: 'secret123',
        },
        contracts.loginFormMeta,
      ),
    ).toEqual({
      credential: '',
      password: 'secret123',
    });
  });

  it('leaves required fields unchanged when they are null', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(
      shapeAuthPayload(
        {
          credential: null,
          password: 'secret123',
        },
        contracts.loginFormMeta,
      ),
    ).toEqual({
      credential: null,
      password: 'secret123',
    });
  });

  it('does not mutate the input payload', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      register: {
        ...DefaultAuthContractConfig.register,
        name: {
          ...DefaultAuthContractConfig.register.name,
          emptyStringPolicy: 'strip',
        },
      },
    });
    const payload = {
      name: '',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    };

    const shaped = shapeAuthPayload(payload, contracts.registerFormMeta);

    expect(shaped).not.toBe(payload);
    expect(payload).toEqual({
      name: '',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('passes through unknown keys unchanged', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(
      shapeAuthPayload(
        {
          email: 'jane@example.com',
          extra: '',
        },
        contracts.forgotPasswordFormMeta,
      ),
    ).toEqual({
      email: 'jane@example.com',
      extra: '',
    });
  });

  it('passes through unknown null keys unchanged', () => {
    const contracts = createAuthContracts(DefaultAuthContractConfig);

    expect(
      shapeAuthPayload(
        {
          email: 'jane@example.com',
          extra: null,
        },
        contracts.forgotPasswordFormMeta,
      ),
    ).toEqual({
      email: 'jane@example.com',
      extra: null,
    });
  });
});
