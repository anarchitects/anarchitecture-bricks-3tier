import {
  AuthUserIdParamsSchema,
  CreateUserProfileRequestDTO,
  CreateUserProfileRequestSchema,
  UpdateUserProfileRequestDTO,
  UpdateUserProfileRequestSchema,
  UserProfileIdParamsSchema,
  UserProfileResponseDTO,
  UserProfileResponseSchema,
} from '@anarchitects/identity-ts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import {
  CreateUserProfileService,
  GetUserProfileService,
  UpdateUserProfileService,
} from '../../application';

@Controller('identity/profiles')
export class UserProfilesController {
  constructor(
    private readonly createUserProfileService: CreateUserProfileService,
    private readonly getUserProfileService: GetUserProfileService,
    private readonly updateUserProfileService: UpdateUserProfileService,
  ) {}

  @HttpCode(200)
  @Post()
  @RouteSchema({
    body: CreateUserProfileRequestSchema,
    response: {
      200: UserProfileResponseSchema,
    },
  })
  createProfile(
    @Body() dto: CreateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO> {
    return this.createUserProfileService.create(dto);
  }

  @Get('by-auth-user/:authUserId')
  @RouteSchema({
    params: AuthUserIdParamsSchema,
    response: {
      200: UserProfileResponseSchema,
    },
  })
  getProfileByAuthUserId(
    @Param('authUserId') authUserId: string,
  ): Promise<UserProfileResponseDTO> {
    return this.getUserProfileService.getByAuthUserId(authUserId);
  }

  @Get(':profileId')
  @RouteSchema({
    params: UserProfileIdParamsSchema,
    response: {
      200: UserProfileResponseSchema,
    },
  })
  getProfileById(
    @Param('profileId') profileId: string,
  ): Promise<UserProfileResponseDTO> {
    return this.getUserProfileService.getById(profileId);
  }

  @Patch(':profileId')
  @RouteSchema({
    body: UpdateUserProfileRequestSchema,
    params: UserProfileIdParamsSchema,
    response: {
      200: UserProfileResponseSchema,
    },
  })
  updateProfile(
    @Param('profileId') profileId: string,
    @Body() dto: UpdateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO> {
    return this.updateUserProfileService.updateById(profileId, dto);
  }
}
