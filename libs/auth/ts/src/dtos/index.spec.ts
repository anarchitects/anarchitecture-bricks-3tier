import { describe, expect, it } from 'vitest';
import * as contractExports from '../contracts';
import * as rootExports from '../index';
import * as coreDtos from './index';
import * as jwtDtos from './jwt/index';

describe('DTO entrypoints', () => {
  it('keeps the root DTO entrypoint focused on the core session-first auth surface', () => {
    expect(coreDtos).toHaveProperty('LoginRequestSchema');
    expect(coreDtos).toHaveProperty('LoggedInUserInfoResponseSchema');
    expect(coreDtos).toHaveProperty('LogoutRequestSchema');

    expect(coreDtos).not.toHaveProperty('LoginResponseSchema');
    expect(coreDtos).not.toHaveProperty('RefreshTokenRequestSchema');
    expect(coreDtos).not.toHaveProperty('RefreshTokenResponseSchema');
    expect(coreDtos).not.toHaveProperty('JwtLogoutRequestSchema');
  });

  it('keeps JWT token DTOs on the dedicated jwt subpath', () => {
    expect(jwtDtos).toHaveProperty('LoginResponseSchema');
    expect(jwtDtos).toHaveProperty('RefreshTokenRequestSchema');
    expect(jwtDtos).toHaveProperty('RefreshTokenResponseSchema');
    expect(jwtDtos).toHaveProperty('JwtLogoutRequestSchema');
  });

  it('exports contract config from root and contracts entrypoints', () => {
    expect(rootExports).toHaveProperty('DefaultAuthContractConfig');
    expect(contractExports).toHaveProperty('DefaultAuthContractConfig');
    expect(rootExports).toHaveProperty('assertContractCompatibility');
    expect(contractExports).toHaveProperty('assertContractCompatibility');
  });
});
