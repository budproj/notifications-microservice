import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration from './config/configuration';
import { HealthCheckDBService } from './healthcheck.db.service';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { NatsController } from './nats.controller';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get<string>('natsConnectionString')],
          },
        }),
      },
    ]),
  ],
  controllers: [NatsController],
  providers: [
    WebSocketService,
    HealthCheckDBService,
    PrismaService,
    AuthService,
    NotificationService,
  ],
})
export class AppModule {}
