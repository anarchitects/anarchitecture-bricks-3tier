import {
  JwtLogoutRequestDTO,
  JwtLogoutRequestSchema,
  LoginResponseDTO,
  LoginResponseSchema,
  RefreshTokenRequestDTO,
  RefreshTokenRequestSchema,
  RefreshTokenResponseDTO,
  RefreshTokenResponseSchema,
} from '@anarchitects/auth-ts/dtos/jwt';
import {
  LoginRequestDTO,
  LoginRequestSchema,
  SuccessResponseDTO,
  SuccessResponseSchema,
} from '@anarchitects/auth-ts/dtos';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { BetterAuthJwtPluginService } from './better-auth-jwt-plugin.service';

@Controller('auth/jwt')
export class JwtAuthPluginController {
  constructor(
    private readonly jwtPluginService: BetterAuthJwtPluginService,
  ) {}

  @HttpCode(200)
  @Post('/login')
  @RouteSchema({
    body: LoginRequestSchema,
    response: { 200: LoginResponseSchema },
  })
  login(@Body() dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.jwtPluginService.login(dto);
  }

  @HttpCode(200)
  @Post('/logout')
  @RouteSchema({
    body: JwtLogoutRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  logout(@Body() dto: JwtLogoutRequestDTO): Promise<SuccessResponseDTO> {
    return this.jwtPluginService.logout(dto);
  }

  @HttpCode(200)
  @Post('/refresh')
  @RouteSchema({
    body: RefreshTokenRequestSchema,
    response: { 200: RefreshTokenResponseSchema },
  })
  refresh(
    @Body() dto: RefreshTokenRequestDTO,
  ): Promise<RefreshTokenResponseDTO> {
    return this.jwtPluginService.refreshTokens(dto);
  }
}
