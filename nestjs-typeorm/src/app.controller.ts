import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getDatabase() {
    return {
      process: {
        DATABASE_URL: this.configService.get<string>('DATABASE_URL'),
        DATABASE_HOST: this.configService.get<string>('DATABASE_HOST'),
        DATABASE_PORT: this.configService.get<number>('DATABASE_PORT'),
      },
    };
  }
}
