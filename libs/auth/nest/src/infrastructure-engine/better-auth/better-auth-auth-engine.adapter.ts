import { Inject, Injectable } from '@nestjs/common';
import type {
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import {
  AuthEngineCapabilityReport,
  AuthEnginePort,
  AuthPasskeySignInInput,
  AuthSignOutOrRefreshInput,
  AuthSocialSignInInput,
} from '../../application/services/auth-engine.port';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';
import { importEsmModule } from './dynamic-import';

type BetterAuthApi = {
  signInEmail?: (input: {
    body: { email: string; password: string };
  }) => Promise<unknown>;
  signInPasskey?: (input: {
    body: { autoFill?: boolean };
    headers?: HeadersInit;
  }) => Promise<unknown>;
  signInSocial?: (input: {
    body: {
      provider: string;
      callbackURL: string;
      errorCallbackURL?: string;
      newUserCallbackURL?: string;
      disableRedirect?: boolean;
    };
    headers?: HeadersInit;
  }) => Promise<unknown>;
  signOut?: (input?: { headers?: HeadersInit }) => Promise<unknown>;
};

type BetterAuthAuthInstance = {
  api?: BetterAuthApi;
  handler: (request: Request) => Promise<Response>;
};

@Injectable()
export class BetterAuthAuthEngineAdapter implements AuthEnginePort {
  private authInstancePromise: Promise<BetterAuthAuthInstance> | null = null;

  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
  ) {}

  async describeCapabilities(): Promise<AuthEngineCapabilityReport> {
    const hasGithubConfig = Boolean(
      this.options.spike.socialProviders.github?.clientId &&
        this.options.spike.socialProviders.github?.clientSecret,
    );

    return {
      engine: 'better-auth',
      flows: [
        {
          flow: 'password-sign-in',
          status: 'supported',
          notes:
            'Spike adapter maps email-password auth through Better Auth internal APIs.',
        },
        {
          flow: 'passkey-sign-in',
          status: this.options.features.passkeys ? 'supported' : 'needs-config',
          notes: this.options.features.passkeys
            ? 'Passkey plugin is enabled for proof-harness execution.'
            : 'Enable auth feature flag `passkeys` before running the passkey proof.',
        },
        {
          flow: 'social-sign-in',
          status:
            this.options.features.social && hasGithubConfig
              ? 'supported'
              : 'needs-config',
          notes:
            this.options.features.social && hasGithubConfig
              ? 'GitHub social sign-in is configured for the proof harness.'
              : 'Enable social feature flag and provide GitHub client credentials.',
        },
        {
          flow: 'sign-out-or-refresh',
          status: 'supported',
          notes:
            this.options.sessionMode === 'session'
              ? 'Better Auth session sign-out is the spike proof path.'
              : 'Better Auth sign-out is available; session-vs-jwt default remains an ADR decision.',
        },
      ],
    };
  }

  login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.passwordSignIn(dto);
  }

  logout(_dto: LogoutRequestDTO): Promise<{ success: boolean }> {
    return Promise.reject(
      new Error(
        'Better Auth logout via the legacy LogoutRequestDTO is unavailable in the spike adapter.',
      ),
    );
  }

  async refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO,
  ): Promise<LoginResponseDTO> {
    const result = await this.signOutOrRefresh({
      mode: 'refresh',
      userId,
      dto,
    });

    if (this.isLoginResponse(result)) {
      return result;
    }

    throw new Error(
      'Better Auth refresh-token mapping is unavailable in the spike adapter.',
    );
  }

  async passwordSignIn(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signInEmail) {
      throw new Error('Better Auth email sign-in API is unavailable.');
    }

    const result = (await auth.api.signInEmail({
      body: {
        email: dto.credential,
        password: dto.password,
      },
    })) as {
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      session?: { token?: string };
    };

    return {
      accessToken:
        result.accessToken ??
        result.token ??
        result.session?.token ??
        'better-auth-session',
      refreshToken:
        result.refreshToken ??
        result.token ??
        result.session?.token ??
        'better-auth-session',
    };
  }

  async passkeySignIn(input: AuthPasskeySignInInput): Promise<unknown> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signInPasskey) {
      throw new Error('Better Auth passkey API is unavailable.');
    }

    return auth.api.signInPasskey({
      body: { autoFill: input.autoFill },
      headers: input.headers,
    });
  }

  async socialSignIn(input: AuthSocialSignInInput): Promise<unknown> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signInSocial) {
      throw new Error('Better Auth social sign-in API is unavailable.');
    }

    return auth.api.signInSocial({
      body: {
        provider: input.provider,
        callbackURL: input.callbackURL,
        errorCallbackURL: input.errorCallbackURL,
        newUserCallbackURL: input.newUserCallbackURL,
        disableRedirect: true,
      },
      headers: input.headers,
    });
  }

  async signOutOrRefresh(input: AuthSignOutOrRefreshInput): Promise<unknown> {
    if (input.mode === 'refresh') {
      return {
        mode: 'refresh',
        status: 'not-implemented',
        notes:
          'Better Auth spike uses sign-out/session semantics; refresh mapping is deferred to ADR.',
      };
    }

    const auth = await this.getAuthInstance();

    if (!auth.api?.signOut) {
      throw new Error('Better Auth sign-out API is unavailable.');
    }

    return auth.api.signOut({ headers: input.headers });
  }

  private async getAuthInstance(): Promise<BetterAuthAuthInstance> {
    if (!this.authInstancePromise) {
      this.authInstancePromise = this.createAuthInstance();
    }

    return this.authInstancePromise;
  }

  private async createAuthInstance(): Promise<BetterAuthAuthInstance> {
    const { betterAuth, betterAuthPasskey } =
      await loadBetterAuthRuntimeModules();
    const { DatabaseSync } = await importEsmModule<{
      DatabaseSync: new (location: string) => unknown;
    }>('node:sqlite');

    return betterAuth.betterAuth({
      secret: this.options.spike.secret,
      baseURL: this.options.spike.baseUrl,
      database: new DatabaseSync(':memory:'),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: this.options.features.social
        ? {
            github: {
              clientId:
                this.options.spike.socialProviders.github?.clientId ??
                'spike-client-id',
              clientSecret:
                this.options.spike.socialProviders.github?.clientSecret ??
                'spike-client-secret',
            },
          }
        : {},
      plugins: this.options.features.passkeys
        ? [
            betterAuthPasskey.passkey({
              rpID: this.options.spike.passkeys.rpID,
              rpName: this.options.spike.passkeys.rpName,
              origin: this.options.spike.passkeys.origin,
            }),
          ]
        : [],
    }) as unknown as BetterAuthAuthInstance;
  }

  private isLoginResponse(value: unknown): value is LoginResponseDTO {
    return Boolean(
      value &&
        typeof value === 'object' &&
        'accessToken' in value &&
        'refreshToken' in value,
    );
  }
}
