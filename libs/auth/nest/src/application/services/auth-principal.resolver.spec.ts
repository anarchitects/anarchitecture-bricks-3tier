import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthPrincipalResolver } from './auth-principal.resolver';

describe('AuthPrincipalResolver', () => {
  let resolver: AuthPrincipalResolver;

  const mockAuthEnginePort = {
    getSession: jest.fn(),
  };

  const mockAuthUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPrincipalResolver,
        { provide: AuthEnginePort, useValue: mockAuthEnginePort },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
      ],
    }).compile();

    resolver = module.get<AuthPrincipalResolver>(AuthPrincipalResolver);
  });

  it('returns null when there is no active session', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue(null);

    await expect(resolver.resolveFromHeaders()).resolves.toBeNull();
    expect(mockAuthUserRepository.findOne).not.toHaveBeenCalled();
  });

  it('hydrates the session user with policy relations', async () => {
    const headers = new Headers({
      cookie: 'better-auth.session=abc',
    });
    const sessionHeaders = new Headers({
      'set-cookie': 'better-auth.session=abc; Path=/; HttpOnly',
    });
    const authUser = { id: 'user-1', roles: [] };
    mockAuthEnginePort.getSession.mockResolvedValue({
      userId: 'user-1',
      headers: sessionHeaders,
    });
    mockAuthUserRepository.findOne.mockResolvedValue(authUser);

    await expect(resolver.resolveFromHeaders(headers)).resolves.toEqual({
      user: authUser,
      headers: sessionHeaders,
    });
    expect(mockAuthEnginePort.getSession).toHaveBeenCalledWith(headers);
    expect(mockAuthUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      relations: { roles: { permissions: true } },
    });
  });

  it('normalizes framework request headers before resolving the session', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue(null);

    await resolver.resolveFromHeaders({
      cookie: ['a=1', 'b=2'],
      host: 'example.test',
      missing: undefined,
    });

    const [headers] = mockAuthEnginePort.getSession.mock.calls[0];
    expect(headers.get('host')).toBe('example.test');
    expect(headers.get('cookie')).toContain('a=1');
    expect(headers.get('cookie')).toContain('b=2');
    expect(headers.has('missing')).toBe(false);
  });

  it('returns null when the session user no longer exists', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue({ userId: 'missing' });
    mockAuthUserRepository.findOne.mockRejectedValue(new NotFoundException());

    await expect(resolver.resolveFromHeaders()).resolves.toBeNull();
  });

  it('throws Unauthorized when a required principal cannot be resolved', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue(null);

    await expect(resolver.requireFromHeaders()).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('keeps resolveUserById as a compatibility wrapper', async () => {
    const authUser = { id: 'user-1', roles: [] };
    const resolveAuthUserByIdSpy = jest
      .spyOn(resolver, 'resolveAuthUserById')
      .mockResolvedValueOnce(authUser as never);

    await expect(resolver.resolveUserById('user-1')).resolves.toEqual(authUser);
    expect(resolveAuthUserByIdSpy).toHaveBeenCalledWith('user-1');
  });
});
