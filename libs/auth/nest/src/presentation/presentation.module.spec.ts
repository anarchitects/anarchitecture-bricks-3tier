import { DynamicModule } from '@nestjs/common';
import { FASTIFY_ROUTE_SCHEMA_METADATA } from '@nestjs/platform-fastify/constants';
import { AuthApplicationModule } from '../application';
import { JwtAuthPluginController } from '../infrastructure-engine/better-auth/plugins/jwt/jwt-auth-plugin.controller';
import { applyAuthControllerContractRouteSchemas } from './auth-controller-route-schemas';
import { AuthController } from './controllers/auth.controller';
import {
  AUTH_CONTRACTS,
  createDefaultAuthContracts,
  type ResolvedAuthContracts,
} from './auth-contracts';
import { AuthPresentationModule } from './presentation.module';

type RouteSchemaMetadata = {
  body?: unknown;
};

type RouteBodySchema = {
  required?: string[];
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
): ResolvedAuthContracts => {
  const provider = moduleMetadata.providers?.find(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'provide' in entry &&
      entry.provide === AUTH_CONTRACTS,
  ) as { useValue: ResolvedAuthContracts } | undefined;

  expect(provider).toBeDefined();
  if (!provider) {
    throw new Error('AUTH_CONTRACTS provider missing from module metadata.');
  }

  return provider.useValue;
};

describe('AuthPresentationModule', () => {
  beforeEach(() => {
    applyAuthControllerContractRouteSchemas(
      AuthController,
      createDefaultAuthContracts(),
    );
  });

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

  it('applies contract overrides to generated route metadata', () => {
    const moduleMetadata = AuthPresentationModule.forRoot({
      contracts: {
        register: {
          name: {
            required: true,
          },
        },
      },
    });

    const contracts = getAuthContracts(moduleMetadata);

    expect(getRouteSchemaBody('registerUser')).toBe(
      contracts.registerRequestSchema,
    );
    expect(
      (contracts.registerRequestSchema as RouteBodySchema).required,
    ).toContain('name');
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
