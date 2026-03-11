import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { authConfig, AuthConfig } from '../config';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './application.module-definition';
import { AbilityFactory } from './factories/ability.factory';
import { AuthService } from './services/auth.service';
import { BcryptHashService } from './services/bcrypt-hash.service';
import { HashService } from './services/hash.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { PoliciesService } from './services/policies.service';
import { JwtStrategy } from './strategies/jwt/strategy';

@Module({})
export class AuthApplicationModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE) {
    const { authStrategies, encryption } = options;
    const imports = [ConfigModule.forFeature(authConfig)];
    const providers = [];
    const exports = [];
    providers.push(AbilityFactory, PoliciesService);
    switch (encryption.algorithm) {
      case 'bcrypt':
        providers.push(BcryptHashService, {
          provide: HashService,
          useExisting: BcryptHashService,
        });
        exports.push(HashService);
        break;
      case 'argon2':
        // Future implementation for Argon2HashService can be added here
        throw new Error('Argon2HashService not implemented yet');
      default:
        throw new Error(
          `Unsupported encryption algorithm: ${encryption.algorithm}`,
        );
    }
    if (authStrategies.includes('jwt')) {
      imports.push(
        JwtModule.registerAsync({
          imports: [ConfigModule.forFeature(authConfig)],
          inject: [authConfig.KEY],
          useFactory: (authConfig: AuthConfig) => ({
            secret: authConfig.jwtSecret,
            signOptions: {
              expiresIn: parseInt(authConfig.jwtExpiration, 10),
              audience: authConfig.jwtAudience,
              issuer: authConfig.jwtIssuer,
            },
          }),
        }),
      );
      providers.push(JwtAuthService, JwtStrategy, {
        provide: AuthService,
        useExisting: JwtAuthService,
      });
      exports.push(AuthService);
    }
    return {
      ...super.forRoot(options),
      imports,
      providers,
      exports,
    };
  }
}
