import { Controller, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateProfile(@Body() body: { signature?: string }, @CurrentUser() user: any) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch('me/password')
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: any,
  ) {
    await this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
    return { ok: true };
  }
}
