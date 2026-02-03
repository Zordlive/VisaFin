import { Controller, Get, Query } from '@nestjs/common';
import { OperateursService } from './operateurs.service';

@Controller('api/operateurs')
export class OperateursController {
  constructor(private operateursService: OperateursService) {}

  @Get()
  async list(@Query('operateur') operateur?: string) {
    return this.operateursService.getOperateurs(operateur);
  }
}
