import { Module } from '@nestjs/common';
import { OperateursController } from './operateurs.controller';
import { OperateursService } from './operateurs.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperateursController],
  providers: [OperateursService],
})
export class OperateursModule {}
