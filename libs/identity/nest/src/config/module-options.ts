import type { IdentityConfig } from './identity.config';

export type IdentityApplicationModuleOptions = Record<string, never>;

export type IdentityPresentationModuleOptions = {
  application?: IdentityApplicationModuleOptions;
};

export type IdentityInfrastructureModuleOptions = Record<string, never>;

export type IdentityModuleOptions = {
  presentation?: IdentityPresentationModuleOptions;
  infrastructure?: IdentityInfrastructureModuleOptions;
};

export const mapIdentityConfigToIdentityModuleOptions = (
  _config: IdentityConfig,
): IdentityModuleOptions => {
  void _config;

  return {};
};
