import { env } from 'node:process';

export default () => ({
  port: parseInt(env.PORT ?? '3000', 10) || 3000,
  database: {
    url: env.DATABASE_URL || '',
    port: parseInt(env.DATABASE_PORT ?? '5432', 10) || 5432,
  },
});
