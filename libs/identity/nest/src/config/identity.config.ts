import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

const IDENTITY_CONFIG_KEY = 'identity';

export const identityConfig = registerAs(IDENTITY_CONFIG_KEY, () => ({}));

export type IdentityConfig = ConfigType<typeof identityConfig>;

export const InjectIdentityConfig = () => Inject(identityConfig.KEY);
