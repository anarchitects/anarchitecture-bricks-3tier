import { MailerPort } from '@anarchitects/common-nest-mailer';
import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import { BetterAuthDatabasePort } from '../../application/services/better-auth-database.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import {
  AuthEngineMutationResult,
  AuthEngineCapabilityReport,
  AuthEnginePort,
  AuthPasskeySignInInput,
  AuthSocialSignInInput,
} from '../../application/services/auth-engine.port';
import { HashService } from '../../application/services/hash.service';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';
import { createBetterAuthOptions } from './better-auth-options';

type BetterAuthApi = {
  signUpEmail?: (input: {
    body: {
      email: string;
      password: string;
      name: string;
      callbackURL?: string;
    };
    headers?: Headers;
    returnHeaders?: true;
  }) => Promise<{ headers: Headers; response: unknown }>;
  signInEmail?: (input: {
    body: { email: string; password: string };
    headers?: Headers;
    returnHeaders?: true;
  }) => Promise<{ headers: Headers; response: unknown }>;
  requestPasswordReset?: (input: {
    body: { email: string; redirectTo?: string };
    headers?: Headers;
  }) => Promise<unknown>;
  resetPassword?: (input: {
    body: { token: string; newPassword: string };
    headers?: Headers;
    returnHeaders?: true;
  }) => Promise<{ headers?: Headers; response?: unknown } | unknown>;
  signInPasskey?: (input: {
    body: { autoFill?: boolean };
    headers?: HeadersInit;
    returnHeaders?: true;
  }) => Promise<{ headers: Headers; response: unknown }>;
  signInSocial?: (input: {
    body: {
      provider: string;
      callbackURL: string;
      errorCallbackURL?: string;
      newUserCallbackURL?: string;
      disableRedirect?: boolean;
    };
    headers?: HeadersInit;
    returnHeaders?: true;
  }) => Promise<unknown>;
  signOut?: (input?: {
    headers?: Headers;
    returnHeaders?: true;
  }) => Promise<{ headers: Headers; response: unknown }>;
  verifyEmail?: (input: {
    query: { token: string };
    headers?: Headers;
    returnHeaders?: true;
  }) => Promise<{ headers?: Headers; response?: unknown } | unknown>;
  getSession?: <R extends boolean, H extends boolean = false>(input: {
    headers: Headers;
    query?: {
      disableCookieCache?: boolean;
      disableRefresh?: boolean;
    };
    asResponse?: R;
    returnHeaders?: H;
  }) => Promise<
    H extends true
      ? { headers: Headers; response: BetterAuthSessionResponse | null }
      : BetterAuthSessionResponse | null
  >;
};

type BetterAuthAuthInstance = {
  api?: BetterAuthApi;
  handler: (request: Request) => Promise<Response>;
};

type BetterAuthSessionResponse = {
  user?: { id?: string };
  session?: { id?: string };
};

@Injectable()
export class BetterAuthAuthEngineAdapter implements AuthEnginePort {
  private authInstancePromise: Promise<BetterAuthAuthInstance> | null = null;

  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
    private readonly betterAuthDatabasePort: BetterAuthDatabasePort,
    private readonly hashService: HashService,
    @Optional() @Inject(MailerPort) private readonly mailer?: MailerPort,
  ) {}

  async describeCapabilities(): Promise<AuthEngineCapabilityReport> {
    const hasGithubConfig = Boolean(
      this.options.plugins.social.github?.clientId &&
        this.options.plugins.social.github?.clientSecret,
    );

    return {
      engine: 'better-auth',
      flows: [
        {
          flow: 'password-sign-in',
          status: 'supported',
          notes: 'Core email-password auth is handled through Better Auth.',
        },
        {
          flow: 'passkey-sign-in',
          status: this.options.plugins.passkeys.enabled
            ? 'supported'
            : 'needs-config',
          notes: this.options.plugins.passkeys.enabled
            ? 'Passkey plugin is enabled.'
            : 'Enable the passkeys plugin before using passkey auth.',
        },
        {
          flow: 'social-sign-in',
          status:
            this.options.plugins.social.enabled && hasGithubConfig
              ? 'supported'
              : 'needs-config',
          notes:
            this.options.plugins.social.enabled && hasGithubConfig
              ? 'GitHub social sign-in is configured.'
              : 'Enable the social plugin and provide GitHub client credentials.',
        },
        {
          flow: 'sign-out',
          status: 'supported',
          notes: 'Core sign-out clears the Better Auth session cookie.',
        },
      ],
    };
  }

  login(dto: LoginRequestDTO, headers?: HeadersInit) {
    return this.passwordSignIn(dto, headers);
  }

  async register(
    dto: RegisterRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signUpEmail) {
      throw new Error('Better Auth email sign-up API is unavailable.');
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name?.trim() || deriveFallbackName(dto.email),
        callbackURL: this.options.betterAuth.callbackUrls.verifyEmail,
      },
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    return {
      success: true,
      headers: result.headers,
      userId: extractUserId(result.response),
    };
  }

  async logout(
    _dto: LogoutRequestDTO,
    headers?: HeadersInit,
  ): Promise<{ success: boolean; headers?: Headers }> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signOut) {
      throw new Error('Better Auth sign-out API is unavailable.');
    }

    const result = await auth.api.signOut({
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    return {
      success: true,
      headers: result.headers,
    };
  }

  async getSession(headers?: HeadersInit) {
    const auth = await this.getAuthInstance();

    if (!auth.api?.getSession) {
      throw new Error('Better Auth get-session API is unavailable.');
    }

    const result = await auth.api.getSession({
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    const userId = extractUserId(result.response);
    if (!userId) {
      return null;
    }

    return {
      userId,
      headers: result.headers,
    };
  }

  async passwordSignIn(
    dto: LoginRequestDTO,
    headers?: HeadersInit,
  ) {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signInEmail) {
      throw new Error('Better Auth email sign-in API is unavailable.');
    }

    const result = await auth.api.signInEmail({
      body: {
        email: dto.credential,
        password: dto.password,
      },
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    const userId = extractUserId(result.response);
    if (!userId) {
      throw new Error('Better Auth email sign-in did not return a user id.');
    }

    return {
      userId,
      headers: result.headers,
    };
  }

  async requestPasswordReset(
    dto: ForgotPasswordRequestDTO,
  ): Promise<AuthEngineMutationResult> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.requestPasswordReset) {
      throw new Error('Better Auth password-reset request API is unavailable.');
    }

    await auth.api.requestPasswordReset({
      body: {
        email: dto.email,
        redirectTo: this.options.betterAuth.callbackUrls.resetPassword,
      },
    });

    return { success: true };
  }

  async resetPassword(
    dto: ResetPasswordRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.resetPassword) {
      throw new Error('Better Auth reset-password API is unavailable.');
    }

    const result = await auth.api.resetPassword({
      body: {
        token: dto.token,
        newPassword: dto.password,
      },
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    return {
      success: true,
      headers: extractHeaders(result),
    };
  }

  async verifyEmail(
    token: string,
    headers?: HeadersInit,
  ): Promise<AuthEngineMutationResult> {
    const auth = await this.getAuthInstance();

    if (!auth.api?.verifyEmail) {
      throw new Error('Better Auth verify-email API is unavailable.');
    }

    const result = await auth.api.verifyEmail({
      query: { token },
      headers: toHeaders(headers),
      returnHeaders: true,
    });

    return {
      success: true,
      headers: extractHeaders(result),
    };
  }

  async passkeySignIn(input: AuthPasskeySignInInput) {
    const auth = await this.getAuthInstance();

    if (!auth.api?.signInPasskey) {
      throw new Error('Better Auth passkey API is unavailable.');
    }

    const result = await auth.api.signInPasskey({
      body: { autoFill: input.autoFill },
      headers: input.headers,
      returnHeaders: true,
    });

    const userId = extractUserId(result.response);
    if (!userId) {
      throw new Error('Better Auth passkey sign-in did not return a user id.');
    }

    return {
      userId,
      headers: result.headers,
    };
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
      returnHeaders: true,
    });
  }

  private async getAuthInstance(): Promise<BetterAuthAuthInstance> {
    if (!this.authInstancePromise) {
      this.authInstancePromise = this.createAuthInstance();
    }

    return this.authInstancePromise;
  }

  private async createAuthInstance(): Promise<BetterAuthAuthInstance> {
    const runtimeModules = await loadBetterAuthRuntimeModules();
    const database = await this.betterAuthDatabasePort.resolveDatabase();

    return runtimeModules.betterAuth.betterAuth(
      createBetterAuthOptions(this.options, database, runtimeModules, {
        hashPassword: (password) => this.hashService.hash(password),
        verifyPassword: ({ hash, password }) =>
          this.hashService.compare(password, hash),
        sendVerificationEmail: ({ email, url }) =>
          this.sendEmail(
            email,
            'Verify your email address',
            buildVerificationEmailHtml(url),
          ),
        sendResetPassword: ({ email, url }) =>
          this.sendEmail(
            email,
            'Reset your password',
            buildResetPasswordEmailHtml(url),
          ),
      }),
    ) as unknown as BetterAuthAuthInstance;
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.mailer) {
      return;
    }

    await this.mailer.send(to, subject, html);
  }
}

const toHeaders = (input?: HeadersInit): Headers => {
  const headers = new Headers();
  if (!input) {
    return headers;
  }

  new Headers(input).forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
};

const extractUserId = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const user = (value as BetterAuthSessionResponse).user;
  if (user?.id) {
    return user.id;
  }

  return undefined;
};

const extractHeaders = (value: unknown): Headers | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const maybeHeaders = (value as { headers?: Headers }).headers;
  return maybeHeaders instanceof Headers ? maybeHeaders : undefined;
};

const deriveFallbackName = (email: string): string =>
  email.split('@')[0]?.trim() || email;

const buildVerificationEmailHtml = (url: string): string =>
  `<p>Verify your email address by following this link:</p><p><a href="${url}">${url}</a></p>`;

const buildResetPasswordEmailHtml = (url: string): string =>
  `<p>Reset your password by following this link:</p><p><a href="${url}">${url}</a></p>`;
