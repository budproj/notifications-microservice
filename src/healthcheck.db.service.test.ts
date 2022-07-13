import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { HealthCheckDBService } from './healthcheck.db.service';
import { PrismaService } from './infrastructure/orm/prisma.service';

beforeEach(jest.resetAllMocks);

describe('HealthCheckDBService', () => {
  let healthCheckDBService: HealthCheckDBService;
  const prismaHealthcheckCreateMock = jest.fn();

  // Module Setup
  beforeEach(async () => {
    const prismaServiceMock = {
      healthCheck: {
        create: prismaHealthcheckCreateMock,
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, HealthCheckDBService],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaServiceMock)
      .compile();

    healthCheckDBService = moduleRef.get(HealthCheckDBService);
  });

  describe('patch', () => {
    it('should call patch with id', () => {
      // Arrrange (Ajeitar)
      const id = randomUUID();

      // Act (Atuar)
      healthCheckDBService.patch(id);

      // Assert (Afirmar)
      expect(prismaHealthcheckCreateMock).toBeCalledTimes(1);
      expect(prismaHealthcheckCreateMock).toBeCalledWith({ data: { id } });
    });
  });
});
