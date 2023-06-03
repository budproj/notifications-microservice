import { Injectable } from '@nestjs/common';
import { notification, Prisma } from '@prisma/client';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { Stopwatch } from './decorators/pino.decorator';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  @Stopwatch()
  async notification(
    notificationWhereUniqueInput: Prisma.notificationWhereUniqueInput,
  ): Promise<notification | null> {
    return this.prisma.notification.findUnique({
      where: notificationWhereUniqueInput,
    });
  }

  @Stopwatch()
  async notifications(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.notificationWhereUniqueInput;
    where?: Prisma.notificationWhereInput;
    orderBy?: Prisma.notificationOrderByWithRelationInput;
  }): Promise<notification[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.notification.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createnotification(
    data: Prisma.notificationCreateInput,
  ): Promise<notification> {
    return this.prisma.notification.create({
      data,
    });
  }

  async updatenotification(params: {
    where: Prisma.notificationWhereUniqueInput;
    data: Prisma.notificationUpdateInput;
  }): Promise<notification> {
    const { data, where } = params;
    return this.prisma.notification.update({
      data,
      where,
    });
  }

  async updatenotifications(params: {
    where: Prisma.notificationWhereInput;
    data: Prisma.notificationUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { data, where } = params;

    return this.prisma.notification.updateMany({
      where,
      data,
    });
  }

  async deletenotification(
    where: Prisma.notificationWhereUniqueInput,
  ): Promise<notification> {
    return this.prisma.notification.delete({
      where,
    });
  }
}
