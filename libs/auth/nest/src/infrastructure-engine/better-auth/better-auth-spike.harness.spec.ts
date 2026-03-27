import { BetterAuthSpikeHarness } from './better-auth-spike.harness';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { AuthEnginePort } from '../../application/services/auth-engine.port';

describe('BetterAuthSpikeHarness', () => {
  it('maps engine capability reports into a proof matrix', async () => {
    const authEnginePort: AuthEnginePort = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      describeCapabilities: jest.fn().mockResolvedValue({
        engine: 'better-auth',
        flows: [
          {
            flow: 'password-sign-in',
            status: 'supported',
            notes: 'ready',
          },
          {
            flow: 'social-sign-in',
            status: 'needs-config',
            notes: 'missing GitHub client credentials',
          },
        ],
      }),
      passwordSignIn: jest.fn(),
      passkeySignIn: jest.fn(),
      socialSignIn: jest.fn(),
      signOutOrRefresh: jest.fn(),
    };

    const options = {
      authStrategies: ['jwt'],
      engine: 'better-auth',
      sessionMode: 'session',
      engineOptions: {
        persistence: {
          mode: 'isolated',
          isolatedTopology: 'same-db',
        },
      },
      features: {
        passkeys: true,
        social: true,
        oidc: false,
      },
      spike: {
        baseUrl: 'http://localhost:3000/api/auth',
        secret: 'better-auth-spike-secret-32-chars-minimum',
        proofHarnessEnabled: true,
        socialProviders: {
          github: undefined,
        },
        passkeys: {
          rpID: 'localhost',
          rpName: 'Anarchitecture Auth Spike',
          origin: undefined,
        },
      },
      encryption: {
        algorithm: 'bcrypt',
        key: 'default_encryption_key',
      },
      persistence: {
        persistence: 'typeorm',
      },
      resourceAuthorization: {
        loaders: {},
      },
    } satisfies ResolvedAuthApplicationModuleOptions;

    const harness = new BetterAuthSpikeHarness(authEnginePort, options);

    await expect(harness.collectProofMatrix()).resolves.toEqual({
      engine: 'better-auth',
      proofHarnessEnabled: true,
      flows: [
        {
          flow: 'password-sign-in',
          status: 'ready',
          notes: 'ready',
        },
        {
          flow: 'social-sign-in',
          status: 'blocked',
          notes: 'missing GitHub client credentials',
        },
      ],
    });
  });
});
