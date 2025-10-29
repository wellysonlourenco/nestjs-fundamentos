import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Carregar variáveis de ambiente do arquivo .env
config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
