import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { Public } from '@anarchitects/auth-declarations';
import { AuthPasskeyService } from '../../application/services/auth-passkey.service';
import { toAuthHeaders } from '../../application/services/auth-headers';
import { applyResponseHeaders } from '../auth-response-headers';
import {
  PasskeyRegistrationBeginRouteSchema,
  type PasskeyRegistrationBeginRequestDTO,
  PasskeyRegistrationFinishRouteSchema,
  type PasskeyRegistrationFinishRequestDTO,
  PasskeyAuthenticationBeginRouteSchema,
  type PasskeyAuthenticationBeginRequestDTO,
  PasskeyAuthenticationFinishRouteSchema,
  type PasskeyAuthenticationFinishRequestDTO,
} from '@anarchitects/auth-ts/dtos/passkeys';

@Controller('auth/passkeys')
export class PasskeyAuthController {
  constructor(private readonly passkeys: AuthPasskeyService) {}

  @Post('registration/begin')
  @HttpCode(200)
  @RouteSchema(PasskeyRegistrationBeginRouteSchema)
  async beginRegistration(
    @Body() dto: PasskeyRegistrationBeginRequestDTO,
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ) {
    const result = await this.passkeys.beginRegistration(
      dto,
      toAuthHeaders(request.headers),
    );
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }

  @Post('registration/finish')
  @HttpCode(200)
  @RouteSchema(PasskeyRegistrationFinishRouteSchema)
  async finishRegistration(
    @Body() dto: PasskeyRegistrationFinishRequestDTO,
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ) {
    const result = await this.passkeys.finishRegistration(
      dto,
      toAuthHeaders(request.headers),
    );
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }

  @Post('authentication/begin')
  @HttpCode(200)
  @Public()
  @RouteSchema(PasskeyAuthenticationBeginRouteSchema)
  async beginAuthentication(
    @Body() dto: PasskeyAuthenticationBeginRequestDTO,
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ) {
    const result = await this.passkeys.beginAuthentication(
      dto,
      toAuthHeaders(request.headers),
    );
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }

  @Post('authentication/finish')
  @HttpCode(200)
  @Public()
  @RouteSchema(PasskeyAuthenticationFinishRouteSchema)
  async finishAuthentication(
    @Body() dto: PasskeyAuthenticationFinishRequestDTO,
    @Req() request: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ) {
    const result = await this.passkeys.finishAuthentication(
      dto,
      toAuthHeaders(request.headers),
    );
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }
}
