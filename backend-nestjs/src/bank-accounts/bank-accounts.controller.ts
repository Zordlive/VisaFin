import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { BankAccountsService } from './bank-accounts.service';
import { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { id: number } };

@Controller('api/bank-accounts')
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Request() req: AuthRequest) {
    return this.bankAccountsService.list(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: AuthRequest, @Body() data: any) {
    return this.bankAccountsService.create(req.user.id, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Request() req: AuthRequest, @Param('id') id: string, @Body() data: any) {
    return this.bankAccountsService.update(req.user.id, parseInt(id), data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.bankAccountsService.remove(req.user.id, parseInt(id));
  }

  @Post(':id/set_default')
  @UseGuards(JwtAuthGuard)
  async setDefault(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.bankAccountsService.setDefault(req.user.id, parseInt(id));
  }
}
