import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LegacyJwtAuthEngineAdapter } from '../../infrastructure-engine/legacy-jwt-auth-engine.adapter';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { AuthOrchestrationService } from './auth-orchestration.service';
import { HashService } from './hash.service';

/**
 * @deprecated Use `AuthService` for controller-facing auth operations.
 * JWT engine access is now an internal wiring concern behind `AuthEnginePort`.
 */
@Injectable()
export class JwtAuthService extends AuthOrchestrationService {
  constructor(
    hashService: HashService,
    authUserRepository: AuthUserRepository,
    jwtService: JwtService,
  ) {
    super(
      hashService,
      authUserRepository,
      new LegacyJwtAuthEngineAdapter(
        hashService,
        authUserRepository,
        jwtService,
      ),
    );
  }
}
