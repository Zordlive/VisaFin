import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('api/referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getReferralsMe(@Request() req) {
    return this.referralsService.getUserReferrals(req.user.id);
  }
}
