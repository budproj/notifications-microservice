import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const natsConnectionString = configService.get<string>(
    'natsConnectionString',
  );

  const PORT = configService.get<string>('port');

  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [natsConnectionString],
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
}
bootstrap();
