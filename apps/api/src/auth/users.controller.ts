import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedUser } from './jwt.strategy';
import { UpdateProfileDto, UserProfileDto } from './auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.auth.getProfile(user.userId, user.email, user.role);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMePut(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.auth.updateProfile(user.userId, dto, user.email, user.role);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMePatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.auth.updateProfile(user.userId, dto, user.email, user.role);
  }
}
