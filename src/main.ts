import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const NATS_CONNECTION_STRING = configService.get<string>(
    'NATS_CONNECTION_STRING',
  );

  const PORT = configService.get<string>('PORT');

  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [NATS_CONNECTION_STRING],
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
}
bootstrap();
