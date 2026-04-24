import { AUTH_PUBLIC_METADATA_KEY } from '@anarchitects/auth-declarations';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthPrincipalResolver } from '../../application/services/auth-principal.resolver';
import { AuthenticationGuard } from './authentication.guard';

describe('AuthenticationGuard', () => {
  let guard: AuthenticationGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const mockAuthPrincipalResolver = {
    requireFromHeaders: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationGuard,
        { provide: Reflector, useValue: mockReflector },
        {
          provide: AuthPrincipalResolver,
          useValue: mockAuthPrincipalResolver,
        },
      ],
    }).compile();

    guard = module.get<AuthenticationGuard>(AuthenticationGuard);
  });

  const createExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as unknown as ExecutionContext;

  it('allows routes marked public without resolving a principal', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) =>
      key === AUTH_PUBLIC_METADATA_KEY ? true : undefined,
    );

    await expect(guard.canActivate(createExecutionContext({}))).resolves.toBe(
      true,
    );
    expect(mockAuthPrincipalResolver.requireFromHeaders).not.toHaveBeenCalled();
  });

  it('allows requests that already have a user attached', async () => {
    const request = { user: { id: 'user-1' } };
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(mockAuthPrincipalResolver.requireFromHeaders).not.toHaveBeenCalled();
  });

  it('resolves the request principal and attaches the user', async () => {
    const request = {
      headers: { cookie: 'better-auth.session=abc' },
    };
    const user = { id: 'user-1' };
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockAuthPrincipalResolver.requireFromHeaders.mockResolvedValue({ user });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(mockAuthPrincipalResolver.requireFromHeaders).toHaveBeenCalledWith(
      request.headers,
    );
    expect(request).toEqual({
      headers: { cookie: 'better-auth.session=abc' },
      user,
    });
  });

  it('bubbles unauthorized principal resolution failures', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    mockAuthPrincipalResolver.requireFromHeaders.mockRejectedValue(
      new UnauthorizedException(),
    );

    await expect(guard.canActivate(createExecutionContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
