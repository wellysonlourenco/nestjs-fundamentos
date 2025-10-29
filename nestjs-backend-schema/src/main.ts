import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Criar diretórios de upload se não existirem
  const uploadDirs = [
    './uploads/avatars',
    './uploads/documents',
    './uploads/videos',
    './uploads/gallery',
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });

  // Servir arquivos estáticos de TODOS os diretórios de upload
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // ============================================
  // 1. CONFIG SERVICE
  // ============================================
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const env = configService.get<string>('NODE_ENV') || 'development';

  // ============================================
  // 2. GLOBAL PREFIX
  // ============================================
  app.setGlobalPrefix('api', {
    exclude: ['health', 'metrics'], // Rotas que não terão o prefixo
  });

  // ============================================
  // 3. VERSIONING
  // ============================================
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================
  // 4. CORS
  // ============================================
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  // ============================================
  // 5. SECURITY - HELMET
  // ============================================
  app.use(
    helmet({
      contentSecurityPolicy: env === 'production',
      crossOriginEmbedderPolicy: env === 'production',
    }),
  );

  // ============================================
  // 6. COMPRESSION
  // ============================================
  app.use(compression());

  // ============================================
  // 7. GLOBAL VALIDATION PIPE
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Lança erro se enviar propriedades extras
      transform: true, // Transforma payloads em instâncias de DTO
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
      disableErrorMessages: env === 'production', // Oculta mensagens em produção
    }),
  );

  // ============================================
  // 9. GRACEFUL SHUTDOWN
  // ============================================
  app.enableShutdownHooks();

  // ============================================
  // 10. START SERVER
  // ============================================
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║   🚀 Servidor rodando com sucesso!    ║
    ║                                       ║
    ║   📍 URL: http://localhost:${port}       ║
    ║   🌍 Ambiente: ${env.toUpperCase().padEnd(21)}  ║
    ║   📅 Data: ${new Date().toLocaleDateString('pt-BR').padEnd(23)}    ║
    ║   ⏰ Hora: ${new Date().toLocaleTimeString('pt-BR').padEnd(23)}    ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
  `);
}
bootstrap();
