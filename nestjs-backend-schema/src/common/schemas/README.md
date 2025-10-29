# Schemas Zod

Esta pasta contém todos os schemas de validação Zod do projeto.

## 📁 Estrutura

- `auth.schema.ts` - Schemas de autenticação (login, registro, reset de senha)
- `user.schema.ts` - Schemas de usuário (CRUD, listagem, busca)
- `document.schema.ts` - Schemas de documentos (CRUD, listagem, upload)

## 🔧 Como usar

### 1. Importar o schema

```typescript
import { createUserSchema, CreateUserInput } from 'src/common/schemas';
```

### 2. Usar no controller com pipe

```typescript
import { usePipe } from 'src/common/pipes';
import { createUserSchema, CreateUserInput } from 'src/common/schemas';

@Post()
create(@Body(usePipe(createUserSchema)) data: CreateUserInput) {
  return this.usersService.create(data);
}
```

### 3. Validar query params

```typescript
import { listUsersQuerySchema, ListUsersQuery } from 'src/common/schemas';

@Get()
findAll(@Query(usePipe(listUsersQuerySchema)) query: ListUsersQuery) {
  return this.usersService.findAll(query.page, query.limit);
}
```

## ✨ Benefícios

- ✅ Validação em runtime
- ✅ Type-safety com TypeScript
- ✅ Mensagens de erro customizadas
- ✅ Transformações automáticas (ex: string → number)
- ✅ Validações complexas (ex: senhas diferentes)
- ✅ Tipos inferidos automaticamente

## 📝 Exemplo de erro

Quando uma validação falha, o retorno é:

```json
{
  "statusCode": 400,
  "message": "Validação falhou",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 6 caracteres"
    }
  ]
}
```

## 🔗 Schemas disponíveis

### Auth

- `registerSchema` - Registro de usuário
- `loginSchema` - Login
- `forgotPasswordSchema` - Esqueci a senha
- `resetPasswordSchema` - Resetar senha
- `changePasswordSchema` - Alterar senha

### User

- `createUserSchema` - Criar usuário
- `updateUserSchema` - Atualizar usuário
- `updateProfileSchema` - Atualizar perfil
- `updatePasswordSchema` - Atualizar senha
- `updateRolesSchema` - Atualizar roles
- `listUsersQuerySchema` - Query params de listagem
- `searchUsersQuerySchema` - Query params de busca

### Document

- `createDocumentSchema` - Criar documento
- `updateDocumentSchema` - Atualizar documento
- `listDocumentsQuerySchema` - Query params de listagem
- `fileUploadSchema` - Validação de arquivo
