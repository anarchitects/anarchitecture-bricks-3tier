import { Inject, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthConfig, InjectAuthConfig } from '../config';
import {
  AUTH_APPLICATION_MODULE_OPTIONS,
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './application.module-definition';
import { AuthService } from './services/auth.service';
import { BcryptHashService } from './services/bcrypt-hash.service';
import { HashService } from './services/hash.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { PoliciesService } from './services/policies.service';
import { JwtStrategy } from './strategies/jwt/strategy';

@Module({})
export class AuthApplicationModule extends ConfigurableModuleClass {
  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS) private options: string | symbol,
    @InjectAuthConfig() private authConfig: AuthConfig,
  ) {
    super();
  }

  static forRoot(options: typeof OPTIONS_TYPE) {
    const { authStrategies, encryption } = options;
    const imports = [];
    const providers = [];
    const exports = [];
    providers.push(PoliciesService);
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
