import {
  ActivateUserRequestDTO,
  ActivateUserRequestSchema,
  ChangePasswordRequestDTO,
  ChangePasswordRequestSchema,
  ForgotPasswordRequestDTO,
  ForgotPasswordRequestSchema,
  LoginRequestDTO,
  LoginRequestSchema,
  LoginResponseDTO,
  LoginResponseSchema,
  LoggedInUserInfoResponseDTO,
  LoggedInUserInfoResponseSchema,
  LogoutRequestDTO,
  LogoutRequestSchema,
  RefreshTokenRequestDTO,
  RefreshTokenRequestSchema,
  RegisterRequestDTO,
  RegisterRequestSchema,
  RegisterResponseDTO,
  RegisterResponseSchema,
  ResetPasswordRequestDTO,
  ResetPasswordRequestSchema,
  SuccessResponseDTO,
  SuccessResponseSchema,
  UpdateEmailRequestDTO,
  UpdateEmailRequestSchema,
  UserIdParamsSchema,
  VerifyEmailRequestDTO,
  VerifyEmailRequestSchema,
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
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { AuthService } from '../../application/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('/register')
  @RouteSchema({
    body: RegisterRequestSchema,
    response: { 200: RegisterResponseSchema },
  })
  async registerUser(
    @Body() dto: RegisterRequestDTO
  ): Promise<RegisterResponseDTO> {
    return this.authService.registerUser(dto);
  }

  @Patch('/activate')
  @RouteSchema({
    body: ActivateUserRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async activateUser(
    @Body() dto: ActivateUserRequestDTO
  ): Promise<SuccessResponseDTO> {
    return this.authService.activateUser(dto);
  }

  @HttpCode(200)
  @Post('/login')
  @RouteSchema({
    body: LoginRequestSchema,
    response: { 200: LoginResponseSchema },
  })
  async login(@Body() dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.authService.login(dto);
  }

  @HttpCode(200)
  @Post('/logout')
  @RouteSchema({
    body: LogoutRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async logout(@Body() dto: LogoutRequestDTO): Promise<SuccessResponseDTO> {
    return this.authService.logout(dto);
  }

  @Patch('/change-password/:userId')
  @RouteSchema({
    body: ChangePasswordRequestSchema,
    params: UserIdParamsSchema,
    response: { 200: SuccessResponseSchema },
  })
  async changePassword(
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordRequestDTO
  ): Promise<SuccessResponseDTO> {
    return this.authService.changePassword(userId, dto);
  }

  @HttpCode(200)
  @Post('/forgot-password')
  @RouteSchema({
    body: ForgotPasswordRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDTO
  ): Promise<SuccessResponseDTO> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(200)
  @Post('/reset-password')
  @RouteSchema({
    body: ResetPasswordRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDTO
  ): Promise<SuccessResponseDTO> {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(200)
  @Post('/verify-email')
  @RouteSchema({
    body: VerifyEmailRequestSchema,
    response: { 200: SuccessResponseSchema },
  })
  async verifyEmail(
    @Body() dto: VerifyEmailRequestDTO
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
    @Body() dto: UpdateEmailRequestDTO
  ): Promise<SuccessResponseDTO> {
    return this.authService.updateEmail(userId, dto);
  }

  @HttpCode(200)
  @Post('/refresh-tokens/:userId')
  @RouteSchema({
    body: RefreshTokenRequestSchema,
    params: UserIdParamsSchema,
    response: { 200: LoginResponseSchema },
  })
  async refreshTokens(
    @Param('userId') userId: string,
    @Body() dto: RefreshTokenRequestDTO
  ): Promise<LoginResponseDTO> {
    return this.authService.refreshTokens(userId, dto);
  }

  @Get('/me')
  @RouteSchema({
    response: { 200: LoggedInUserInfoResponseSchema },
  })
  async getLoggedInUserInfo(
    @Req() req: { user: { sub: string } }
  ): Promise<LoggedInUserInfoResponseDTO> {
    const userId = req.user.sub; // Assuming JWT payload contains 'sub' as userId
    return this.authService.getLoggedInUserInfo(userId);
  }
}
