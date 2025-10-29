import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService, JwtService],
})
export class DocumentsModule {}
