import {
  PasskeyRegistrationBeginRequestSchema,
  PasskeyRegistrationBeginResponseSchema,
  PasskeyRegistrationFinishRequestSchema,
  PasskeyRegistrationFinishResponseSchema,
} from './passkey-registration.dto.js';
import {
  PasskeyAuthenticationBeginRequestSchema,
  PasskeyAuthenticationBeginResponseSchema,
  PasskeyAuthenticationFinishRequestSchema,
  PasskeyAuthenticationFinishResponseSchema,
} from './passkey-authentication.dto.js';

// Pure Fastify fields for future @RouteSchema consumers. HTTP routes and OpenAPI
// operationId/tags are assigned by Nest presentation and central spec tooling.
export const PasskeyRegistrationBeginRouteSchema = {
  body: PasskeyRegistrationBeginRequestSchema,
  response: { 200: PasskeyRegistrationBeginResponseSchema },
};
export const PasskeyRegistrationFinishRouteSchema = {
  body: PasskeyRegistrationFinishRequestSchema,
  response: { 200: PasskeyRegistrationFinishResponseSchema },
};
export const PasskeyAuthenticationBeginRouteSchema = {
  body: PasskeyAuthenticationBeginRequestSchema,
  response: { 200: PasskeyAuthenticationBeginResponseSchema },
};
export const PasskeyAuthenticationFinishRouteSchema = {
  body: PasskeyAuthenticationFinishRequestSchema,
  response: { 200: PasskeyAuthenticationFinishResponseSchema },
};
