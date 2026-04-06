import { DynamicModule } from '@nestjs/common';
import { FASTIFY_ROUTE_SCHEMA_METADATA } from '@nestjs/platform-fastify/constants';
import { AuthApplicationModule } from '../application';
import { JwtAuthPluginController } from '../infrastructure-engine/better-auth/plugins/jwt/jwt-auth-plugin.controller';
import { AuthController } from './controllers/auth.controller';
import {
  AUTH_CONTRACTS,
  type DefaultAuthContracts,
} from './auth-contracts';
import { AuthPresentationModule } from './presentation.module';

type RouteSchemaMetadata = {
  body?: unknown;
};

const getRouteSchemaBody = (methodName: keyof AuthController): unknown =>
  (
    Reflect.getMetadata(
      FASTIFY_ROUTE_SCHEMA_METADATA,
      AuthController.prototype[methodName],
    ) as RouteSchemaMetadata
  ).body;

const getAuthContracts = (
  moduleMetadata: DynamicModule,
): DefaultAuthContracts => {
  const provider = moduleMetadata.providers?.find(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'provide' in entry &&
      entry.provide === AUTH_CONTRACTS,
  ) as { useValue: DefaultAuthContracts } | undefined;

  expect(provider).toBeDefined();
  return provider!.useValue;
};

describe('AuthPresentationModule', () => {
  it('composes application forRoot options when overrides are provided', () => {
    const moduleMetadata = AuthPresentationModule.forRoot({
      application: {
        encryption: {
          algorithm: 'bcrypt',
          key: 'presentation-key',
        },
      },
    });

    expect(moduleMetadata.module).toBe(AuthPresentationModule);
    const [applicationImport] = moduleMetadata.imports as DynamicModule[];
    expect(applicationImport.module).toBe(AuthApplicationModule);

    const contracts = getAuthContracts(moduleMetadata);
    expect(getRouteSchemaBody('registerUser')).toBe(
      contracts.registerRequestSchema,
    );
  });

  it('mounts the JWT plugin controller only when the plugin is enabled', () => {
    const enabled = AuthPresentationModule.forRoot({
      application: {
        plugins: {
          jwt: { enabled: true },
        },
      },
    });
    const disabled = AuthPresentationModule.forRoot({
      application: {
        plugins: {
          jwt: { enabled: false },
        },
      },
    });

    expect(enabled.controllers).toContain(JwtAuthPluginController);
    expect(disabled.controllers).toEqual([]);
  });

  it('merges config-backed plugin overrides through forRootFromConfig', () => {
    const moduleMetadata = AuthPresentationModule.forRootFromConfig({
      application: {
        plugins: {
          jwt: { enabled: true },
        },
      },
    });

    expect(moduleMetadata.module).toBe(AuthPresentationModule);
    expect(moduleMetadata.controllers).toContain(JwtAuthPluginController);

    const contracts = getAuthContracts(moduleMetadata);
    expect(getRouteSchemaBody('forgotPassword')).toBe(
      contracts.forgotPasswordRequestSchema,
    );
  });
});
