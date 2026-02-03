import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getReferralsMe(@Request() req: AuthRequest) {
    return this.referralsService.getUserReferrals(req.user.id);
  }
}
