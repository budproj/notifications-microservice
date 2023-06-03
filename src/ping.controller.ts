import { Controller, Get } from '@nestjs/common';
import { Stopwatch } from './decorators/pino.decorator';

@Controller('/ping')
export class PingController {
  @Get('')
  @Stopwatch()
  async ping() {
    return { pong: Date.now() };
  }
}
