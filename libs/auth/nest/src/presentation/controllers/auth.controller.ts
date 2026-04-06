import {
  ActivateUserRequestDTO,
  ActivateUserRequestSchema,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LoggedInUserInfoResponseDTO,
  LoggedInUserInfoResponseSchema,
  LogoutRequestDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  RegisterResponseSchema,
  ResetPasswordRequestDTO,
  SuccessResponseDTO,
  SuccessResponseSchema,
  UpdateEmailRequestDTO,
  UpdateEmailRequestSchema,
  UserIdParamsSchema,
  VerifyEmailRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { AuthService } from '../../application/services/auth.service';
import { AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER } from '../auth-controller-route-schemas';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('/register')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: RegisterResponseSchema },
  })
  async registerUser(
    @Body() dto: RegisterRequestDTO,
  ): Promise<RegisterResponseDTO> {
    return this.authService.registerUser(dto);
  }

  @Patch('/activate')
  @RouteSchema({
    body: ActivateUserRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async activateUser(
    @Body() dto: ActivateUserRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.activateUser(dto);
  }

  @HttpCode(200)
  @Post('/login')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: LoggedInUserInfoResponseSchema },
  })
  async login(
    @Body() dto: LoginRequestDTO,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ): Promise<LoggedInUserInfoResponseDTO> {
    const result = await this.authService.login(dto, toHeaders(req.headers));
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }

  @HttpCode(200)
  @Post('/logout')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: SuccessResponseSchema },
  })
  async logout(
    @Body() dto: LogoutRequestDTO,
    @Req() req: { headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    reply: { header(name: string, value: string | string[]): unknown },
  ): Promise<SuccessResponseDTO> {
    const result = await this.authService.logout(dto, toHeaders(req.headers));
    applyResponseHeaders(reply, result.headers);
    return result.body;
  }

  @Patch('/change-password/:userId')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    params: UserIdParamsSchema,
    response: { 200: SuccessResponseSchema },
  })
  async changePassword(
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.changePassword(userId, dto);
  }

  @HttpCode(200)
  @Post('/forgot-password')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: SuccessResponseSchema },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(200)
  @Post('/reset-password')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: SuccessResponseSchema },
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(200)
  @Post('/verify-email')
  @RouteSchema({
    body: AUTH_CONTRACT_ROUTE_SCHEMA_PLACEHOLDER,
    response: { 200: SuccessResponseSchema },
  })
  async verifyEmail(
    @Body() dto: VerifyEmailRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.verifyEmail(dto);
  }

  @Patch('/update-email/:userId')
  @RouteSchema({
    body: UpdateEmailRequestSchema,
    params: UserIdParamsSchema,
    response: { 200: SuccessResponseSchema },
  })
  async updateEmail(
    @Param('userId') userId: string,
    @Body() dto: UpdateEmailRequestDTO,
  ): Promise<SuccessResponseDTO> {
    return this.authService.updateEmail(userId, dto);
  }

  @Get('/me')
  @RouteSchema({
    response: { 200: LoggedInUserInfoResponseSchema },
  })
  async getLoggedInUserInfo(
    @Req() req: { headers: Record<string, string | string[] | undefined> },
  ): Promise<LoggedInUserInfoResponseDTO> {
    const result = await this.authService.getLoggedInUserInfo(
      toHeaders(req.headers),
    );
    return result.body;
  }
}

const toHeaders = (
  input: Record<string, string | string[] | undefined>,
): Headers => {
  const headers = new Headers();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      return;
    }

    headers.set(key, value);
  });

  return headers;
};

const applyResponseHeaders = (
  reply: { header(name: string, value: string | string[]): unknown },
  headers?: Headers,
): void => {
  if (!headers) {
    return;
  }

  const setCookie =
    'getSetCookie' in headers && typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : headers.get('set-cookie');

  if (Array.isArray(setCookie) && setCookie.length > 0) {
    reply.header('set-cookie', setCookie);
    return;
  }

  if (typeof setCookie === 'string' && setCookie.length > 0) {
    reply.header('set-cookie', setCookie);
  }
};
