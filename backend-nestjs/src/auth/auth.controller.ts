import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './services/auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { GoogleOAuthDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

    @Post('google')
    async loginWithGoogle(@Body() dto: GoogleOAuthDto) {
      return this.authService.loginWithGoogle(dto.token);
    }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: ExpressRequest) {
    return req.user;
  }
}
