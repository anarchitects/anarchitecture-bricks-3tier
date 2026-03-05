import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ExampleAuthService } from './example-auth.service';

@Injectable()
export class AuthContextGuard implements CanActivate {
  constructor(private readonly authService: ExampleAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
      raw?: { headers?: { authorization?: string } };
      user?: unknown;
    }>();

    const authHeader =
      req.headers?.authorization ?? req.raw?.headers?.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : undefined;

    const user = this.authService.resolveAccessToken(bearerToken);
    if (user) {
      req.user = user;
    }

    return true;
  }
}
