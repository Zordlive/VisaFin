import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return this.usersService.getUserWithDetails(req.user.id);
  }

  @Put('user')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Request() req, @Body() data: any) {
    return this.usersService.updateUser(req.user.id, data);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  async getUser(@Request() req) {
    return this.usersService.getUserWithDetails(req.user.id);
  }
}
