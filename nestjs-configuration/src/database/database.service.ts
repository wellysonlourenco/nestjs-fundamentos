import { Inject, Injectable } from '@nestjs/common';

type DatabaseConfig = {
  url: string;
  host: string;
  port: number;
};

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_CONFIG')
    private readonly config: DatabaseConfig,
  ) {}

  getDatabaseUrl(): string {
    return this.config.url;
  }

  getDatabaseHost(): string {
    return this.config.host;
  }

  getDatabasePort(): number {
    return this.config.port;
  }
}
