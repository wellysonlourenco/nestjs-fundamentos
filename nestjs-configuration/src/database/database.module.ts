import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_CONFIG',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          url: configService.get<string>('DATABASE_URL'),
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
        };
      },
    },
  ],
  exports: ['DATABASE_CONFIG', DatabaseService],
})
export class DatabaseModule {}
