import { Type } from '@sinclair/typebox';
import { FASTIFY_ROUTE_SCHEMA_METADATA } from '@nestjs/platform-fastify/constants';

type ContractSchemaKey =
  | 'changePasswordRequestSchema'
  | 'forgotPasswordRequestSchema'
  | 'loginRequestSchema'
  | 'logoutRequestSchema'
  | 'registerRequestSchema'
  | 'resetPasswordRequestSchema'
  | 'verifyEmailRequestSchema';

type AuthContractRouteSchemas = Record<ContractSchemaKey, unknown>;

type RouteSchemaMetadata = {
  body?: unknown;
  headers?: unknown;
  params?: unknown;
  querystring?: unknown;
  response?: unknown;
};

export const AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER = Type.Object(
  {},
  { additionalProperties: true },
);

export const AUTH_CONTROLLER_CONTRACT_ROUTE_SCHEMA_KEYS = {
  changePassword: 'changePasswordRequestSchema',
  forgotPassword: 'forgotPasswordRequestSchema',
  login: 'loginRequestSchema',
  logout: 'logoutRequestSchema',
  registerUser: 'registerRequestSchema',
  resetPassword: 'resetPasswordRequestSchema',
  verifyEmail: 'verifyEmailRequestSchema',
} as const satisfies Record<string, ContractSchemaKey>;

export function applyAuthControllerContractRouteSchemas(
  controller: { prototype: object },
  contracts: AuthContractRouteSchemas,
): void {
  const prototype = controller.prototype as Record<string, unknown>;

  for (const [methodName, schemaKey] of Object.entries(
    AUTH_CONTROLLER_CONTRACT_ROUTE_SCHEMA_KEYS,
  ) as Array<
    [keyof typeof AUTH_CONTROLLER_CONTRACT_ROUTE_SCHEMA_KEYS, ContractSchemaKey]
  >) {
    const handler = prototype[methodName];

    if (typeof handler !== 'function') {
      throw new Error(
        `AuthController handler "${methodName}" is not available for route-schema rewiring.`,
      );
    }

    const routeSchema = Reflect.getMetadata(
      FASTIFY_ROUTE_SCHEMA_METADATA,
      handler,
    ) as RouteSchemaMetadata | undefined;

    if (!routeSchema) {
      throw new Error(
        `AuthController handler "${methodName}" is missing Fastify route schema metadata.`,
      );
    }

    const nextBody = contracts[schemaKey];

    if (routeSchema.body === nextBody) {
      continue;
    }

    Reflect.defineMetadata(
      FASTIFY_ROUTE_SCHEMA_METADATA,
      {
        ...routeSchema,
        body: nextBody,
      } satisfies RouteSchemaMetadata,
      handler,
    );
  }
}
