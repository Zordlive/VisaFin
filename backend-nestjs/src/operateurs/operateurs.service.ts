import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OperateursService {
  constructor(private prisma: PrismaService) {}

  async getOperateurs(operateur?: string) {
    const list = await this.prisma.operateur.findMany({
      where: operateur ? { operateur } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return list.map((o) => ({
      id: o.id,
      numero_agent: o.numeroAgent,
      nom_agent: o.nomAgent,
      operateur: o.operateur,
      created_at: o.createdAt,
      updated_at: o.updatedAt,
    }));
  }
}
