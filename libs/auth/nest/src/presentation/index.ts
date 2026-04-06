export * from './presentation.module';
export * from './controllers/auth.controller';
export * from './guards/policies.guard';
export * from './guards/resource-authorization.guard';
export * from './decorators/policies.decorator';
export * from './decorators/authorize-resource.decorator';
export * from './decorators/authorized-resource.decorator';
export * from './route-policy';
export type {
  AuthContractConfigOverrides,
  AuthPresentationModuleOptions,
} from '../config';
