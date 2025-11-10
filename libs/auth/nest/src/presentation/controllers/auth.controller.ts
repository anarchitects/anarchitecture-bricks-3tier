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
  UpdateEmailRequestDTO,
  UpdateEmailRequestSchema,
  VerifyEmailRequestDTO,
  VerifyEmailRequestSchema,
} from '@anarchitects/auth-ts/dtos';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { AuthService } from '../../application/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    response: {
      200: { success: { type: 'boolean' } },
    },
  })
  async activateUser(
    @Body() dto: ActivateUserRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.activateUser(dto);
  }

  @Post('/login')
  @RouteSchema({
    body: LoginRequestSchema,
    response: { 200: LoginResponseSchema },
  })
  async login(@Body() dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.authService.login(dto);
  }

  @Post('/logout')
  @RouteSchema({
    body: LogoutRequestSchema,
    response: { 200: { success: { type: 'boolean' } } },
  })
  async logout(@Body() dto: LogoutRequestDTO): Promise<{ success: boolean }> {
    return this.authService.logout(dto);
  }

  @Patch('/change-password/:userId')
  @RouteSchema({
    body: ChangePasswordRequestSchema,
    params: {
      userId: { type: 'string' },
    },
    response: { 200: { success: { type: 'boolean' } } },
  })
  async changePassword(
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.changePassword(userId, dto);
  }

  @Post('/forgot-password')
  @RouteSchema({
    body: ForgotPasswordRequestSchema,
    response: { 200: { success: { type: 'boolean' } } },
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.forgotPassword(dto);
  }

  @Post('/reset-password')
  @RouteSchema({
    body: ResetPasswordRequestSchema,
    response: { 200: { success: { type: 'boolean' } } },
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.resetPassword(dto);
  }

  @Post('/verify-email')
  @RouteSchema({
    body: VerifyEmailRequestSchema,
    response: { 200: { success: { type: 'boolean' } } },
  })
  async verifyEmail(
    @Body() dto: VerifyEmailRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.verifyEmail(dto);
  }

  @Patch('/update-email/:userId')
  @RouteSchema({
    body: UpdateEmailRequestSchema,
    params: {
      userId: { type: 'string' },
    },
    response: { 200: { success: { type: 'boolean' } } },
  })
  async updateEmail(
    @Param('userId') userId: string,
    @Body() dto: UpdateEmailRequestDTO
  ): Promise<{ success: boolean }> {
    return this.authService.updateEmail(userId, dto);
  }

  @Post('/refresh-tokens/:userId')
  @RouteSchema({
    body: RefreshTokenRequestSchema,
    params: {
      userId: { type: 'string' },
    },
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
    response: {
      200: {
        type: 'object',
        properties: {
          user: { type: 'object' }, // Define user schema as needed
          rbac: {
            type: 'array',
            items: { type: 'object' }, // Define PolicyRule schema as needed
          },
        },
      },
    },
  })
  async getLoggedInUserInfo(
    @Req() req: { user: { sub: string } }
  ): Promise<{ user: User; rbac: PolicyRule[] }> {
    const userId = req.user.sub; // Assuming JWT payload contains 'sub' as userId
    return this.authService.getLoggedInUserInfo(userId);
  }
}
