import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { HealthCheckDBService } from './healthcheck.db.service';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { RabbitmqController } from './rabbitmq.controller';
import { PingController } from './ping.controller';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: ['req.headers'],
        },
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
            singleLine: true,
          },
        },
      },
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
  controllers: [RabbitmqController, PingController],
  providers: [
    WebSocketService,
    HealthCheckDBService,
    PrismaService,
    AuthService,
    NotificationService,
  ],
})
export class AppModule {}
