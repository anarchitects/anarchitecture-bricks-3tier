import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  Policies,
  PoliciesGuard,
} from '@anarchitects/auth-nest/presentation';

@Controller('protected')
export class ProtectedController {
  @Get('admin')
  @UseGuards(PoliciesGuard)
  @Policies({ action: 'read', subject: 'admin-panel' })
  getAdminPanel(@Req() req: { user: { sub: string } }) {
    return {
      area: 'admin',
      userId: req.user.sub,
      status: 'granted',
    };
  }
}
