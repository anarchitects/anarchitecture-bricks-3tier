import {
  ActivateUserRequestSchema,
  UpdateEmailRequestSchema,
} from '@anarchitects/auth-ts/dtos';
import { FASTIFY_ROUTE_SCHEMA_METADATA } from '@nestjs/platform-fastify/constants';
import {
  applyAuthControllerContractRouteSchemas,
} from './auth-controller-route-schemas';
import { createDefaultAuthContracts } from './auth-contracts';
import { AuthController } from './controllers/auth.controller';

type RouteSchemaMetadata = {
  body?: unknown;
};

const getRouteSchema = (methodName: keyof AuthController): RouteSchemaMetadata =>
  Reflect.getMetadata(
    FASTIFY_ROUTE_SCHEMA_METADATA,
    AuthController.prototype[methodName],
  ) as RouteSchemaMetadata;

describe('applyAuthControllerContractRouteSchemas', () => {
  it('applies generated request schemas to the epic auth flows', () => {
    const contracts = createDefaultAuthContracts();

    applyAuthControllerContractRouteSchemas(AuthController, contracts);

    expect(getRouteSchema('registerUser').body).toBe(
      contracts.registerRequestSchema,
    );
    expect(getRouteSchema('login').body).toBe(contracts.loginRequestSchema);
    expect(getRouteSchema('logout').body).toBe(contracts.logoutRequestSchema);
    expect(getRouteSchema('changePassword').body).toBe(
      contracts.changePasswordRequestSchema,
    );
    expect(getRouteSchema('forgotPassword').body).toBe(
      contracts.forgotPasswordRequestSchema,
    );
    expect(getRouteSchema('resetPassword').body).toBe(
      contracts.resetPasswordRequestSchema,
    );
    expect(getRouteSchema('verifyEmail').body).toBe(
      contracts.verifyEmailRequestSchema,
    );
  });

  it('preserves non-epic route schemas', () => {
    const contracts = createDefaultAuthContracts();

    applyAuthControllerContractRouteSchemas(AuthController, contracts);

    expect(getRouteSchema('activateUser').body).toBe(ActivateUserRequestSchema);
    expect(getRouteSchema('updateEmail').body).toBe(UpdateEmailRequestSchema);
    expect(getRouteSchema('getLoggedInUserInfo').body).toBeUndefined();
  });
});
