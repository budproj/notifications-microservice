import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'bud', type: 'topic' }],
        uri: configService.get<string>('rabbitmqConnectionString'),
        enableControllerDiscovery: true,
      }),
    }),
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
