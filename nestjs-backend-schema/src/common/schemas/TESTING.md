# Guia de Testes com Schemas Zod

## Como testar validações

### Exemplo 1: Teste básico de validação

```typescript
import { loginSchema } from 'src/common/schemas';

describe('Login Schema', () => {
  it('deve validar email e senha válidos', () => {
    const valid = {
      email: 'user@example.com',
      password: '123456',
    };

    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    const invalid = {
      email: 'invalid-email',
      password: '123456',
    };

    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Email inválido');
    }
  });

  it('deve rejeitar senha curta', () => {
    const invalid = {
      email: 'user@example.com',
      password: '12345', // menos de 6 caracteres
    };

    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

### Exemplo 2: Teste de transformações

```typescript
import { listUsersQuerySchema } from 'src/common/schemas';

describe('List Users Query Schema', () => {
  it('deve transformar strings em números', () => {
    const query = {
      page: '2',
      limit: '20',
    };

    const result = listUsersQuerySchema.parse(query);

    expect(typeof result.page).toBe('number');
    expect(result.page).toBe(2);
    expect(typeof result.limit).toBe('number');
    expect(result.limit).toBe(20);
  });

  it('deve usar valores padrão', () => {
    const query = {};

    const result = listUsersQuerySchema.parse(query);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('deve transformar isActive em boolean', () => {
    const query = {
      isActive: 'true',
    };

    const result = listUsersQuerySchema.parse(query);

    expect(typeof result.isActive).toBe('boolean');
    expect(result.isActive).toBe(true);
  });
});
```

### Exemplo 3: Teste de validações complexas

```typescript
import { changePasswordSchema } from 'src/common/schemas';

describe('Change Password Schema', () => {
  it('deve rejeitar senhas iguais', () => {
    const data = {
      oldPassword: 'senha123',
      newPassword: 'senha123', // mesma senha
    };

    const result = changePasswordSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (issue) => issue.path[0] === 'newPassword',
      );
      expect(error?.message).toContain('diferente');
    }
  });

  it('deve aceitar senhas diferentes', () => {
    const data = {
      oldPassword: 'senha123',
      newPassword: 'novaSenha456',
    };

    const result = changePasswordSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

### Exemplo 4: Teste com mock de controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { usePipe } from 'src/common/pipes';
import { loginSchema } from 'src/common/schemas';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('deve rejeitar dados inválidos', async () => {
    const invalidData = {
      email: 'invalid',
      password: '123',
    };

    expect(() => {
      usePipe(loginSchema).transform(invalidData, {} as any);
    }).toThrow(BadRequestException);
  });

  it('deve aceitar dados válidos e chamar o service', async () => {
    const validData = {
      email: 'user@example.com',
      password: '123456',
    };

    jest.spyOn(service, 'login').mockResolvedValue({
      access_token: 'token',
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: '1',
        email: validData.email,
        fullName: 'User',
        roles: ['USER'],
      },
    } as any);

    const result = await controller.login(validData as any);

    expect(service.login).toHaveBeenCalledWith(
      validData.email.toLowerCase(),
      validData.password,
    );
    expect(result).toHaveProperty('access_token');
  });
});
```

### Exemplo 5: Teste de utils

```typescript
import {
  safeValidate,
  formatZodError,
  withPagination,
  makeOptional,
} from 'src/common/schemas';
import { z } from 'zod';

describe('Schema Utils', () => {
  describe('safeValidate', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('deve retornar success true para dados válidos', () => {
      const data = { name: 'John', age: 30 };
      const result = safeValidate(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
      }
    });

    it('deve retornar success false para dados inválidos', () => {
      const data = { name: 'John', age: 'thirty' };
      const result = safeValidate(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('formatZodError', () => {
    it('deve formatar erros em formato legível', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = schema.safeParse({
        email: 'invalid',
        age: 15,
      });

      if (!result.success) {
        const formatted = formatZodError(result.error);

        expect(formatted).toHaveLength(2);
        expect(formatted[0]).toHaveProperty('field');
        expect(formatted[0]).toHaveProperty('message');
        expect(formatted[0]).toHaveProperty('code');
      }
    });
  });

  describe('withPagination', () => {
    it('deve adicionar campos de paginação', () => {
      const baseSchema = z.object({
        search: z.string().optional(),
      });

      const paginatedSchema = withPagination(baseSchema);

      const result = paginatedSchema.parse({
        search: 'test',
        page: '2',
        limit: '20',
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.search).toBe('test');
    });
  });

  describe('makeOptional', () => {
    it('deve tornar todos os campos opcionais', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const optionalSchema = makeOptional(schema);

      const result = optionalSchema.parse({});

      expect(result).toEqual({});
    });
  });
});
```

## Comandos úteis

```bash
# Rodar todos os testes
npm test

# Rodar testes em watch mode
npm test -- --watch

# Rodar testes com cobertura
npm test -- --coverage

# Rodar apenas testes de schemas
npm test -- schemas
```
