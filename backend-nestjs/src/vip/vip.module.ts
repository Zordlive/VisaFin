import { Module } from '@nestjs/common';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VipController],
  providers: [VipService],
})
export class VipModule {}
