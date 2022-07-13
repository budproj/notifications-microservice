import { Injectable } from '@nestjs/common';
import { PrismaService } from './infrastructure/orm/prisma.service';

@Injectable()
export class HealthCheckDBService {
  constructor(private prisma: PrismaService) {}

  async patch(id: string) {
    // await this.prisma.healthCheck.deleteMany();
    return this.prisma.healthCheck.create({ data: { id } });
  }
}
